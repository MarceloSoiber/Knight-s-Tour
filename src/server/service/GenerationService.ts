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
		this.initializePopulation(cfg.chromosomes, cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		const shouldStop = (): boolean => Boolean(callbacks.shouldStop && callbacks.shouldStop());

		let best = this.population[0];
		let generation = 0;
		let stopped = false;

		while (generation < cfg.generations) {
			if (shouldStop()) {
				stopped = true;
				break;
			}

			if (cfg.processingOption === 'elitist') {
				if (await this.generateElitistGeneration(cfg, shouldStop)) {
					stopped = true;
					break;
				}
			} else {
				if (await this.generateRouletteGeneration(cfg, shouldStop)) {
					stopped = true;
					break;
				}
			}
			generation += 1;
			this.sortPopulation();
			best = this.population[0];

			if (best.getScore() === this.totalSquares) {
				break;
			}

			if (callbacks.onGeneration) {
				callbacks.onGeneration({
					generation,
					bestFitness: best.getScore(),
					avgFitness: this.calculateAverageFitness(),
					chromosomeTotal: this.population.length,
					totalGenerations: cfg.generations
				});
			}

			if (shouldStop()) {
				stopped = true;
				break;
			}

			if (best.getScore() === this.totalSquares) {
				break;
			}

			// Yield the event loop every iteration to keep cancellation responsive.
			await this.sleep(0);
		}

		this.sortPopulation();
		best = this.population[0];
		
		const validPath = this.extractValidPath(best.getSolution());

		return {
			generationsExecuted: generation,
			bestFitness: best.getScore(),
			avgFitness: this.calculateAverageFitness(),
			solution: validPath,
			stopped
		};
	}

	private normalizeConfig(config: Partial<GenerationConfig>): GenerationConfig {
		return {
			generations: Number(config.generations) || 1,
			chromosomes: Number(config.chromosomes) || 100,
			selectionRate: Number(config.selectionRate) || 50,
			crossoverRate: Number(config.crossoverRate) || 100,
			mutationRate: Number(config.mutationRate) || 5,
			seriesPerMutation: Number(config.seriesPerMutation) || 5,
			lifeExpectancy: Number(config.lifeExpectancy) || 15,
			activateLifeExpectancy: Boolean(config.activateLifeExpectancy),
			processingOption: config.processingOption === 'elitist' ? 'elitist' : 'rotation'
		};
	}

	private initializePopulation(quantity: number, lifeExpectancy: number, activateLifeExpectancy: boolean): void {
		this.population = [];

		for (let i = 0; i < quantity; i++) {
			const genes = this.createRandomGenes();
			const chromosome = new Chromosome(-2);
			chromosome.setSolution(genes);
			chromosome.setScore(this.fitness(chromosome));
			this.population.push(chromosome);
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

	private async generateElitistGeneration(cfg: GenerationConfig, shouldStop: () => boolean): Promise<boolean> {
		if (shouldStop()) return true;
		this.agePopulation(cfg.activateLifeExpectancy);

		const crossoverCount = Math.floor((cfg.crossoverRate * this.population.length) / 100);
		const limit = crossoverCount % 2 === 0 ? crossoverCount : crossoverCount - 1;

		for (let i = 0; i < limit - 1 && i + 1 < this.population.length; i += 2) {
			if (shouldStop()) return true;
			if ((i & 15) === 0) await this.sleep(0);
			const father = this.population[i];
			const mother = this.population[i + 1];
			const cutPoint = Math.floor(Math.random() * Math.max(1, this.totalSquares - 2));
			const [child1, child2] = this.generateChildren(father, mother, cutPoint);
			this.population.push(child1, child2);
		}

		if (shouldStop()) return true;
		this.selectIndividuals(cfg.selectionRate);
		if (shouldStop()) return true;
		if (await this.mutate(cfg.mutationRate, cfg.seriesPerMutation, shouldStop)) return true;
		if (shouldStop()) return true;
		this.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		return shouldStop();
	}

	private async generateRouletteGeneration(cfg: GenerationConfig, shouldStop: () => boolean): Promise<boolean> {
		if (shouldStop()) return true;
		this.agePopulation(cfg.activateLifeExpectancy);

		const crossoverCount = Math.floor((cfg.crossoverRate * this.population.length) / 100);
		const limit = crossoverCount % 2 === 0 ? crossoverCount : crossoverCount - 1;

		for (let i = 0; i < limit; i += 2) {
			if (shouldStop()) return true;
			if ((i & 15) === 0) await this.sleep(0);
			const fatherIndex = Math.floor(Math.random() * this.population.length);
			const motherIndex = Math.floor(Math.random() * this.population.length);

			const father = this.population[fatherIndex];
			const mother = this.population[motherIndex];
			const cutPoint = Math.floor(Math.random() * Math.max(1, this.totalSquares));
			const [child1, child2] = this.generateChildren(father, mother, cutPoint);
			this.population.push(child1, child2);
		}

		if (shouldStop()) return true;
		if (await this.mutate(cfg.mutationRate, cfg.seriesPerMutation, shouldStop)) return true;
		if (shouldStop()) return true;
		this.selectIndividuals(cfg.selectionRate);
		if (shouldStop()) return true;
		this.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		return shouldStop();
	}

	private generateChildren(father: Chromosome, mother: Chromosome, cutPoint: number): [Chromosome, Chromosome] {
		const fatherGenes = father.getSolution();
		const motherGenes = mother.getSolution();

		const childGenes1 = this.crossGenes(fatherGenes, motherGenes, cutPoint);
		const childGenes2 = this.crossGenes(motherGenes, fatherGenes, cutPoint);

		const child1 = new Chromosome(-2);
		child1.setSolution(childGenes1);
		child1.setScore(this.fitness(child1));

		const child2 = new Chromosome(-2);
		child2.setSolution(childGenes2);
		child2.setScore(this.fitness(child2));

		return [child1, child2];
	}

	private crossGenes(first: number[], second: number[], cutPoint: number): number[] {
		const cut = Math.max(0, Math.min(cutPoint, first.length));
		const genes: number[] = [];
		const used = new Array<boolean>(this.totalSquares + 1).fill(false);

		for (let i = 0; i < cut; i++) {
			const gene = first[i];
			genes.push(gene);
			used[gene] = true;
		}

		for (let i = 0; i < second.length; i++) {
			const gene = second[i];
			if (!used[gene]) {
				genes.push(gene);
				used[gene] = true;
			}
		}

		return genes;
	}

	private selectIndividuals(selectionRate: number): void {
		this.sortPopulation();
		if (this.population.length === 0) return;

		// Keep at least one chromosome to avoid empty-population crashes.
		const count = Math.max(1, Math.floor((this.population.length * selectionRate) / 100));
		this.population = this.population.slice(0, Math.min(count, this.population.length));
	}

	private async mutate(mutationRate: number, swapsPerIndividual: number, shouldStop?: () => boolean): Promise<boolean> {
		if (this.population.length === 0 || mutationRate <= 0 || swapsPerIndividual <= 0) {
			return false;
		}

		const mutationCount = Math.floor((mutationRate * 100) / this.population.length);
		if (mutationCount <= 0) {
			return false;
		}
		const indexLimit = Math.max(1, this.totalSquares - 1);

		for (let i = 0; i < mutationCount; i++) {
			if (shouldStop && shouldStop()) return true;
			if ((i & 15) === 0) await this.sleep(0);
			const index = Math.floor(Math.random() * this.population.length);
			const chromosome = this.population[index];
			const genes = chromosome.getSolution();
			if (genes.length < 2) {
				continue;
			}

			for (let j = 0; j < swapsPerIndividual; j++) {
				if (shouldStop && shouldStop()) return true;
				if ((j & 15) === 0) await this.sleep(0);
				const a = Math.floor(Math.random() * indexLimit);
				let b = Math.floor(Math.random() * indexLimit);
				while (b === a) {
					b = Math.floor(Math.random() * indexLimit);
				}
				[genes[a], genes[b]] = [genes[b], genes[a]];
			}

			chromosome.setSolution(genes);
			chromosome.setScore(this.fitness(chromosome));
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
			}else{
				// chromosome.setScore(0);
				// nextPopulation.push(chromosome);
			}
		}

		this.population = nextPopulation;

		if (this.population.length === 0) {
			// If all chromosomes expired, reseed one individual so evolution can continue.
			const fallback = new Chromosome(-2);
			fallback.setSolution(this.createRandomGenes());
			fallback.setScore(this.fitness(fallback));
			fallback.setAge(lifeExpectancy);
			this.population.push(fallback);
		}
	}

	private fitness(chromosome: Chromosome): number {
		const genes = chromosome.getSolution();
		if (!genes || genes.length === 0) return 0;

		// Fitness must reflect the contiguous tour shown on the board.
		let total = 1;
		for (let i = 1; i < genes.length; i++) {
			if (this.isValidKnightMove(genes[i - 1], genes[i])) {
				total += 1;
			} else {
				break;
			}
		}

		return total;
	}

	private isValidKnightMove(origin: number, destination: number): boolean {
		if (origin < 1 || origin > this.totalSquares || destination < 1 || destination > this.totalSquares) {
			return false;
		}
		return this.validMoves[origin][destination];
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

	private convertPositionToCoordinate(position: number): { row: number; col: number } {
		const index = position - 1;
		return {
			row: Math.floor(index / this.boardSize),
			col: index % this.boardSize
		};
	}

	private convertSolutionToCoordinates(solution: number[]): Array<{ row: number; col: number }> {
		return solution.map((position) => this.convertPositionToCoordinate(position));
	}

	private extractValidPath(solution: number[]): Array<{ row: number; col: number }> {
		if (!solution || solution.length === 0) return [];

		const validPath = [this.convertPositionToCoordinate(solution[0])];

		for (let i = 1; i < solution.length; i++) {
			const origin = solution[i - 1];
			const destination = solution[i];
			if (!this.isValidKnightMove(origin, destination)) {
				break;
			}

			validPath.push(this.convertPositionToCoordinate(destination));
		}

		return validPath;
	}

	private sortPopulation(): void {
		//this.population.sort((a, b) => b.getScore() - a.getScore());
		this.population.sort((a, b) => {
			const scoreDiff = b.getScore() - a.getScore();
			if (scoreDiff !== 0) {
				return scoreDiff;
			}

			return a.getAge() - b.getAge();
		});
	}

	private calculateAverageFitness(): number {
		if (this.population.length === 0) return 0;
		const total = this.population.reduce((acc, item) => acc + item.getScore(), 0);
		return total / this.population.length;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GenerationService;
