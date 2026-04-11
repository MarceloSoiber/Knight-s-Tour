import Chromosome from '../model/Chromosome.ts';

export type GenerationCallbacks = {
	shouldStop?: () => boolean;
	onGeneration?: (payload: {
		generation: number;
		bestFitness: number;
		avgFitness: number;
		chromosomeTotal: number;
		totalGenerations: number;
	}) => void;
};

export type GenerationConfig = {
	generations: number;
	chromosomes: number;
	selectionRate: number;
	crossoverRate: number;
	mutationRate: number;
	seriesPerMutation: number;
	lifeExpectancy: number;
	activateLifeExpectancy: boolean;
	processingOption: 'elitist' | 'rotation';
};

export type GenerationResult = {
	generationsExecuted: number;
	bestFitness: number;
	avgFitness: number;
	solution: Array<{ row: number; col: number }>;
	stopped: boolean;
};

class GenerationService {
	private boardSize: number;
	private totalSquares: number;
	private population: Chromosome[];
	private validMoves: boolean[][];

	constructor(boardSize: number = 8) {
		this.boardSize = boardSize;
		this.totalSquares = boardSize * boardSize;
		this.population = [];
		this.validMoves = this.createValidMovesMatrix();
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		const cfg = this.normalizeConfig(config);

		const shouldStop = () => Boolean(callbacks.shouldStop && callbacks.shouldStop());

		await this.initializePopulation(cfg.chromosomes, cfg.lifeExpectancy, cfg.activateLifeExpectancy, shouldStop);

		if (shouldStop()) {
			const best = this.population[0] ?? null;
			return {
				generationsExecuted: 0,
				bestFitness: best?.getScore() ?? 0,
				avgFitness: this.population.length > 0 ? this.calculateAverageFitness() : 0,
				solution: best ? this.extractValidPath(best.getSolution()) : [],
				stopped: true
			};
		}

		if (this.population.length === 0) {
			return {
				generationsExecuted: 0,
				bestFitness: 0,
				avgFitness: 0,
				solution: [],
				stopped: false
			};
		}

		let generation = 0;
		let stopped = false;

		while (generation < cfg.generations) {
			if (shouldStop()) {
				stopped = true;
				break;
			}

			if (await this.generateGeneration(cfg, shouldStop)) {
				stopped = true;
				break;
			}

			if (this.population.length === 0) {
				stopped = true;
				break;
			}

			generation++;

			this.sortPopulation();
			const best = this.population[0];
			const bestFitness = best.getScore();
			const avgFitness = this.calculateAverageFitness();

			if (callbacks.onGeneration) {
				callbacks.onGeneration({
					generation,
					bestFitness,
					avgFitness,
					chromosomeTotal: this.population.length,
					totalGenerations: cfg.generations
				});
			}

			if (bestFitness === this.totalSquares) {
				break;
			}

			if ((generation & 7) === 0) {
				await this.sleep(0);
			}
		}

		if (this.population.length === 0) {
			return {
				generationsExecuted: generation,
				bestFitness: 0,
				avgFitness: 0,
				solution: [],
				stopped
			};
		}

		this.sortPopulation();
		const best = this.population[0];
		const bestFitness = best.getScore();
		const avgFitness = this.calculateAverageFitness();

		return {
			generationsExecuted: generation,
			bestFitness,
			avgFitness,
			solution: this.extractValidPath(best.getSolution()),
			stopped
		};
	}

	private normalizeConfig(config: Partial<GenerationConfig>): GenerationConfig {
		return {
			generations: config.generations ?? 1,
			chromosomes: config.chromosomes ?? 100,
			selectionRate: config.selectionRate ?? 50,
			crossoverRate: config.crossoverRate ?? 100,
			mutationRate: config.mutationRate ?? 5,
			seriesPerMutation: config.seriesPerMutation ?? 5,
			lifeExpectancy: config.lifeExpectancy ?? 15,
			activateLifeExpectancy: config.activateLifeExpectancy ?? false,
			processingOption: config.processingOption === 'elitist' ? 'elitist' : 'rotation'
		};
	}

	private async initializePopulation(
		quantity: number,
		lifeExpectancy: number,
		activateLifeExpectancy: boolean,
		shouldStop?: () => boolean
	): Promise<void> {
		this.population = [];

		for (let i = 0; i < quantity; i++) {
			if (shouldStop && shouldStop()) return;

			const genes = this.createRandomGenes();
			const chromosome = new Chromosome(-2);
			chromosome.setSolution(genes);
			chromosome.setScore(this.fitness(chromosome));
			this.population.push(chromosome);

			if ((i & 15) === 0) {
				await this.sleep(0);
			}
		}

		this.applyLifeExpectancy(lifeExpectancy, activateLifeExpectancy);
		this.sortPopulation();
	}

	private createRandomGenes(): number[] {
		const genes = Array.from({ length: this.totalSquares }, (_, i) => i + 1);

		for (let i = genes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[genes[i], genes[j]] = [genes[j], genes[i]];
		}

		return genes;
	}

	private async generateGeneration(cfg: GenerationConfig, shouldStop: () => boolean): Promise<boolean> {
		if (shouldStop()) return true;

		this.agePopulation(cfg.activateLifeExpectancy);
		this.sortPopulation();
		if (this.population.length < 2) return false;

		const basePopulation = [...this.population];
		const offspring: Chromosome[] = [];
		const crossoverIndividuals = Math.floor((Math.max(0, Math.min(100, cfg.crossoverRate)) * basePopulation.length) / 100);
		const pairCount = Math.floor(crossoverIndividuals / 2);

		for (let i = 0; i < pairCount; i++) {
			if (shouldStop()) return true;

			const [father, mother] = cfg.processingOption === 'elitist'
				? this.pickElitistPair(basePopulation, i)
				: this.pickRandomPair(basePopulation);

			const [child1, child2] = this.generateChildren(father, mother);
			offspring.push(child1, child2);

			if ((i & 15) === 0) {
				await this.sleep(0);
			}
		}

		this.population = [...basePopulation, ...offspring];
		this.selectPopulationByRate(cfg.selectionRate);

		if (shouldStop()) return true;

		if (await this.mutate(cfg.mutationRate, cfg.seriesPerMutation, shouldStop)) return true;

		this.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);

		return false;
	}

	private pickElitistPair(population: Chromosome[], pairIndex: number): [Chromosome, Chromosome] {
		const father = population[(pairIndex * 2) % population.length];
		const mother = population[(pairIndex * 2 + 1) % population.length];
		return [father, mother];
	}

	private pickRandomPair(population: Chromosome[]): [Chromosome, Chromosome] {
		const father = population[Math.floor(Math.random() * population.length)];
		const mother = population[Math.floor(Math.random() * population.length)];
		return [father, mother];
	}

	private getSelectionCount(selectionRate: number): number {
		const boundedRate = Math.max(1, Math.min(100, Number(selectionRate) || 50));
		return Math.max(2, Math.floor((this.population.length * boundedRate) / 100));
	}

	private selectPopulationByRate(selectionRate: number): void {
		if (this.population.length === 0) return;

		this.sortPopulation();
		const selectionCount = this.getSelectionCount(selectionRate);
		this.population = this.population.slice(0, Math.min(selectionCount, this.population.length));
	}

	private getSelectionPool(selectionCount: number, mode: GenerationConfig['processingOption']): Chromosome[] {
		if (selectionCount >= this.population.length) {
			return [...this.population];
		}

		if (mode === 'elitist') {
			return this.population.slice(0, selectionCount);
		}

		const shuffled = [...this.population].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, selectionCount);
	}

	private preserveElite(count: number = 1): Chromosome[] {
		this.sortPopulation();
		return this.population.slice(0, count);
	}

	private tournamentSelection(pool: Chromosome[], size: number = 3): Chromosome {
		const source = pool.length > 0 ? pool : this.population;
		let best: Chromosome | null = null;

		for (let i = 0; i < size; i++) {
			const candidate = source[Math.floor(Math.random() * source.length)];
			if (!best || candidate.getScore() > best.getScore()) {
				best = candidate;
			}
		}

		return best!;
	}

	private generateOffspring(father: Chromosome, mother: Chromosome, crossoverRate: number): [Chromosome, Chromosome] {
		const boundedRate = Math.max(0, Math.min(100, Number(crossoverRate) || 0));

		if (Math.random() * 100 >= boundedRate) {
			return [father.clone(), mother.clone()];
		}

		return this.generateChildren(father, mother);
	}

	private generateChildren(father: Chromosome, mother: Chromosome): [Chromosome, Chromosome] {
		const child1Genes = this.crossOX(father.getSolution(), mother.getSolution());
		const child2Genes = this.crossOX(mother.getSolution(), father.getSolution());

		const child1 = new Chromosome(-2);
		child1.setSolution(child1Genes);
		child1.setScore(this.fitness(child1));

		const child2 = new Chromosome(-2);
		child2.setSolution(child2Genes);
		child2.setScore(this.fitness(child2));

		return [child1, child2];
	}

	private crossOX(parent1: number[], parent2: number[]): number[] {
		const size = parent1.length;
		const child = new Array<number>(size).fill(-1);

		let start = Math.floor(Math.random() * size);
		let end = Math.floor(Math.random() * size);

		if (start > end) [start, end] = [end, start];

		for (let i = start; i <= end; i++) {
			child[i] = parent1[i];
		}

		let p2Index = 0;

		for (let i = 0; i < size; i++) {
			if (child[i] !== -1) continue;

			while (child.includes(parent2[p2Index])) {
				p2Index++;
			}

			child[i] = parent2[p2Index++];
		}

		return child;
	}

	private async mutate(
		mutationRate: number,
		swapsPerIndividual: number,
		shouldStop?: () => boolean
	): Promise<boolean> {
		if (mutationRate <= 0 || swapsPerIndividual <= 0) return false;

		const mutationCount = Math.floor((this.population.length * mutationRate) / 100);

		const indices = [...Array(this.population.length).keys()]
			.sort(() => Math.random() - 0.5)
			.slice(0, mutationCount);

		for (const index of indices) {
			if (shouldStop && shouldStop()) return true;

			const chromosome = this.population[index];
			const genes = chromosome.getSolution();
			const size = genes.length;

			for (let j = 0; j < swapsPerIndividual; j++) {
				const a = Math.floor(Math.random() * size);
				let b = Math.floor(Math.random() * size);
				while (b === a) b = Math.floor(Math.random() * size);

				[genes[a], genes[b]] = [genes[b], genes[a]];
			}

			chromosome.setSolution(genes);
			chromosome.setScore(this.fitness(chromosome));

			if ((index & 7) === 0) {
				await this.sleep(0);
			}
		}

		return false;
	}

	private agePopulation(enabled: boolean): void {
		if (!enabled) return;

		for (const chromosome of this.population) {
			chromosome.setAge(chromosome.getAge() - 1);
		}
	}

	private applyLifeExpectancy(lifeExpectancy: number, enabled: boolean): void {
		if (!enabled) return;

		const nextPopulation: Chromosome[] = [];

		for (const chromosome of this.population) {
			if (chromosome.getAge() === -2) {
				chromosome.setAge(lifeExpectancy);
				nextPopulation.push(chromosome);
			} else if (chromosome.getAge() > 0) {
				nextPopulation.push(chromosome);
			}
		}

		this.population = nextPopulation;
	}

	private fitness(chromosome: Chromosome): number {
		return this.getLongestValidPathRange(chromosome.getSolution()).length;
	}

	private createValidMovesMatrix(): boolean[][] {
		const matrix = Array.from({ length: this.totalSquares + 1 }, () =>
			new Array<boolean>(this.totalSquares + 1).fill(false)
		);

		for (let origin = 1; origin <= this.totalSquares; origin++) {
			const from = this.convertPositionToCoordinate(origin);

			for (let destination = 1; destination <= this.totalSquares; destination++) {
				const to = this.convertPositionToCoordinate(destination);

				const dr = Math.abs(from.row - to.row);
				const dc = Math.abs(from.col - to.col);

				matrix[origin][destination] = (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
			}
		}

		return matrix;
	}

	private convertPositionToCoordinate(position: number) {
		const index = position - 1;

		return {
			row: Math.floor(index / this.boardSize),
			col: index % this.boardSize
		};
	}

	private extractValidPath(solution: number[]) {
		const range = this.getLongestValidPathRange(solution);
		return solution
			.slice(range.start, range.start + range.length)
			.map((pos) => this.convertPositionToCoordinate(pos));
	}

	private countValidMovesScore(solution: number[]): number {
		if (solution.length === 0) return 0;

		let validMoves = 0;

		for (let i = 1; i < solution.length; i++) {
			if (this.validMoves[solution[i - 1]][solution[i]]) {
				validMoves++;
			}
		}

		return validMoves + 1;
	}

	private getValidPrefixLength(solution: number[]): number {
		if (solution.length === 0) return 0;

		let length = 1;

		for (let i = 1; i < solution.length; i++) {
			if (this.validMoves[solution[i - 1]][solution[i]]) {
				length++;
			} else {
				break;
			}
		}

		return length;
	}

	private getLongestValidPathRange(solution: number[]): { start: number; length: number } {
		if (solution.length === 0) {
			return { start: 0, length: 0 };
		}

		let bestStart = 0;
		let bestLength = 1;
		let currentStart = 0;
		let currentLength = 1;

		for (let i = 1; i < solution.length; i++) {
			if (this.validMoves[solution[i - 1]][solution[i]]) {
				currentLength++;
			} else {
				currentStart = i;
				currentLength = 1;
			}

			if (currentLength > bestLength) {
				bestLength = currentLength;
				bestStart = currentStart;
			}
		}

		return { start: bestStart, length: bestLength };
	}

	private sortPopulation(): void {
		this.population.sort((a, b) => {
			const scoreDiff = b.getScore() - a.getScore();
			if (scoreDiff !== 0) return scoreDiff;

			const prefixDiff = this.getValidPrefixLength(b.getSolution()) - this.getValidPrefixLength(a.getSolution());
			if (prefixDiff !== 0) return prefixDiff;

			return b.getAge() - a.getAge();
		});
	}

	private calculateAverageFitness(): number {
		if (this.population.length === 0) return 0;
		const total = this.population.reduce((acc, c) => acc + c.getScore(), 0);
		return total / this.population.length;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GenerationService;
