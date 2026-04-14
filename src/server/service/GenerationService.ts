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
	enableAdaptiveMutationOnPlateau: boolean;
	plateauMutationRate: number;
	seriesPerMutation: number;
	lifeExpectancy: number;
	activateLifeExpectancy: boolean;
	processingOption: 'elitist' | 'rotation';
	enablePartialRestart: boolean;
	plateauGenerations: number;
	restartEliteCount: number;
	restartPopulationRate: number;
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
	private readonly diversityPrefixLength: number;
	private readonly diversityPenaltyWeight: number;

	constructor(boardSize: number = 8) {
		this.boardSize = boardSize;
		this.totalSquares = boardSize * boardSize;
		this.population = [];
		this.validMoves = this.createValidMovesMatrix();
		this.diversityPrefixLength = Math.max(4, Math.floor(boardSize * 0.75));
		this.diversityPenaltyWeight = 0.35;
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		const cfg = this.normalizeConfig(config);

		const shouldStop = () => Boolean(callbacks.shouldStop && callbacks.shouldStop());

		await this.initializePopulation(cfg.chromosomes, cfg.lifeExpectancy, cfg.activateLifeExpectancy, shouldStop);

		if (shouldStop()) {
			const best = this.getBestChromosomeByScore();
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

		this.sortPopulation();
		let lastBestFitness = this.getBestChromosomeByScore()?.getScore() ?? 0;
		let plateauCounter = 0;
		let currentMutationRate = cfg.mutationRate;

		while (generation < cfg.generations) {
			if (shouldStop()) {
				stopped = true;
				break;
			}

			if (await this.generateGeneration(cfg, shouldStop, currentMutationRate)) {
				stopped = true;
				break;
			}

			if (this.population.length === 0) {
				stopped = true;
				break;
			}

			generation++;

			this.sortPopulation();
			let bestFitness = this.getBestChromosomeByScore()?.getScore() ?? 0;
			let avgFitness = this.calculateAverageFitness();

			if (bestFitness === lastBestFitness) {
				plateauCounter++;
			} else {
				lastBestFitness = bestFitness;
				plateauCounter = 0;
				currentMutationRate = cfg.mutationRate;
			}

			const reachedPlateau = plateauCounter > this.getAdaptivePlateauLimit(cfg.plateauGenerations, bestFitness);

			if (cfg.enableAdaptiveMutationOnPlateau && reachedPlateau) {
				currentMutationRate = Math.max(cfg.mutationRate, cfg.plateauMutationRate);
			}

			if (
				cfg.enablePartialRestart
				&& reachedPlateau
			) {
				if (await this.partialRestartWithElite(cfg, shouldStop)) {
					stopped = true;
					break;
				}
				plateauCounter = 0;
				currentMutationRate = cfg.mutationRate;

				if (this.population.length === 0) {
					stopped = true;
					break;
				}

				this.sortPopulation();
				bestFitness = this.getBestChromosomeByScore()?.getScore() ?? 0;
				avgFitness = this.calculateAverageFitness();
				lastBestFitness = bestFitness;
			}

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
		const best = this.getBestChromosomeByScore();
		const bestFitness = best?.getScore() ?? 0;
		const avgFitness = this.calculateAverageFitness();

		return {
			generationsExecuted: generation,
			bestFitness,
			avgFitness,
			solution: best ? this.extractValidPath(best.getSolution()) : [],
			stopped
		};
	}

	private getBestChromosomeByScore(): Chromosome | null {
		if (this.population.length === 0) return null;

		let best = this.population[0];
		for (let i = 1; i < this.population.length; i++) {
			const candidate = this.population[i];
			if (candidate.getScore() > best.getScore()) {
				best = candidate;
				continue;
			}

			if (candidate.getScore() === best.getScore() && candidate.getFitness() > best.getFitness()) {
				best = candidate;
			}
		}

		return best;
	}

	private normalizeConfig(config: Partial<GenerationConfig>): GenerationConfig {
		return {
			generations: config.generations ?? 1,
			chromosomes: config.chromosomes ?? 100,
			selectionRate: config.selectionRate ?? 50,
			crossoverRate: config.crossoverRate ?? 100,
			mutationRate: config.mutationRate ?? 5,
			enableAdaptiveMutationOnPlateau: config.enableAdaptiveMutationOnPlateau ?? false,
			plateauMutationRate: Math.max(0, Math.min(100, config.plateauMutationRate ?? 15)),
			seriesPerMutation: config.seriesPerMutation ?? 5,
			lifeExpectancy: config.lifeExpectancy ?? 15,
			activateLifeExpectancy: config.activateLifeExpectancy ?? false,
			processingOption: config.processingOption === 'elitist' ? 'elitist' : 'rotation',
			enablePartialRestart: config.enablePartialRestart ?? false,
			plateauGenerations: Math.max(1, config.plateauGenerations ?? 20),
			restartEliteCount: Math.max(1, config.restartEliteCount ?? 2),
			restartPopulationRate: Math.max(1, Math.min(100, config.restartPopulationRate ?? 70))
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
			this.evaluateChromosome(chromosome);
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

	private async generateGeneration(
		cfg: GenerationConfig,
		shouldStop: () => boolean,
		mutationRateOverride?: number
	): Promise<boolean> {
		if (shouldStop()) return true;

		const effectiveMutationRate = Math.max(
			0,
			Math.min(100, Number(mutationRateOverride ?? cfg.mutationRate) || 0)
		);

		this.agePopulation(cfg.activateLifeExpectancy);
		this.sortPopulation();
		if (this.population.length < 2) return false;

		const basePopulation = [...this.population];
		const targetPopulationSize = cfg.chromosomes;
		const selectionCount = this.getSelectionCount(cfg.selectionRate);
		const matingPool = this.getSelectionPool(selectionCount, cfg.processingOption);
		if (matingPool.length < 2) return false;

		const eliteCount = Math.max(1, Math.min(basePopulation.length, selectionCount));
		const elites = basePopulation.slice(0, eliteCount);
		const offspringNeeded = Math.max(0, targetPopulationSize - elites.length);
		const pairCount = Math.max(1, Math.ceil(offspringNeeded / 2));
		const offspring: Chromosome[] = [];
		const shuffledPool = cfg.processingOption === 'rotation'
			? [...matingPool].sort(() => Math.random() - 0.5)
			: matingPool;

		for (let i = 0; i < pairCount; i++) {
			if (shouldStop()) return true;

			const [father, mother] = cfg.processingOption === 'elitist'
				? this.pickElitistPair(shuffledPool, i)
				: this.pickRandomPair(shuffledPool);

			const [child1, child2] = this.generateOffspring(father, mother, cfg.crossoverRate);
			offspring.push(child1, child2);

			if ((i & 15) === 0) {
				await this.sleep(0);
			}
		}

		this.population = [...elites, ...offspring].slice(0, targetPopulationSize);
		await this.replenishPopulation(targetPopulationSize, shouldStop);

		if (shouldStop()) return true;

				if (await this.mutate(effectiveMutationRate, cfg.seriesPerMutation, shouldStop)) return true;

		this.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		await this.replenishPopulation(targetPopulationSize, shouldStop);

		return false;
	}

	private async partialRestartWithElite(cfg: GenerationConfig, shouldStop?: () => boolean): Promise<boolean> {
		if (this.population.length === 0) return false;
		if (shouldStop && shouldStop()) return true;

		this.sortPopulation();

		const eliteCount = Math.max(1, Math.min(cfg.restartEliteCount, this.population.length));
		const nonEliteCount = Math.max(0, this.population.length - eliteCount);
		if (nonEliteCount === 0) return false;

		const restartCount = Math.max(
			1,
			Math.floor((nonEliteCount * Math.max(1, Math.min(100, cfg.restartPopulationRate))) / 100)
		);
		const survivorsCount = Math.max(0, nonEliteCount - restartCount);

		const elites = this.population.slice(0, eliteCount);
		const nonElites = this.population.slice(eliteCount);
		const survivors = nonElites
			.sort(() => Math.random() - 0.5)
			.slice(0, survivorsCount);
		const newcomers: Chromosome[] = [];

		for (let i = 0; i < restartCount; i++) {
			if (shouldStop && shouldStop()) return true;

			const genes = this.createRandomGenes();
			const chromosome = new Chromosome(-2);
			chromosome.setSolution(genes);
			this.evaluateChromosome(chromosome);
			newcomers.push(chromosome);

			if ((i & 15) === 0) {
				await this.sleep(0);
			}
		}

		this.population = [...elites, ...survivors, ...newcomers];
		this.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		this.sortPopulation();
		return false;
	}

	private pickElitistPair(population: Chromosome[], pairIndex: number): [Chromosome, Chromosome] {
		if (population.length < 2) {
			const single = population[0];
			return [single, single];
		}

		const father = population[(pairIndex * 2) % population.length];
		let mother = population[(pairIndex * 2 + 1) % population.length];

		if (mother === father) {
			mother = population[(pairIndex * 2 + 2) % population.length];
		}

		return [father, mother];
	}

	private pickRandomPair(population: Chromosome[]): [Chromosome, Chromosome] {
		const father = population[Math.floor(Math.random() * population.length)];
		if (population.length < 2) return [father, father];

		let mother = population[Math.floor(Math.random() * population.length)];
		while (mother === father) {
			mother = population[Math.floor(Math.random() * population.length)];
		}

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

	private async replenishPopulation(targetPopulationSize: number, shouldStop?: () => boolean): Promise<void> {
		while (this.population.length < targetPopulationSize) {
			if (shouldStop && shouldStop()) return;

			const genes = this.createRandomGenes();
			const chromosome = new Chromosome(-2);
			chromosome.setSolution(genes);
			this.evaluateChromosome(chromosome);
			this.population.push(chromosome);

			if ((this.population.length & 15) === 0) {
				await this.sleep(0);
			}
		}

		if (this.population.length > targetPopulationSize) {
			this.population.length = targetPopulationSize;
		}
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
			if (!best || candidate.getFitness() > best.getFitness()) {
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
		this.evaluateChromosome(child1);

		const child2 = new Chromosome(-2);
		child2.setSolution(child2Genes);
		this.evaluateChromosome(child2);

		return [child1, child2];
	}

	private crossOX(parent1: number[], parent2: number[]): number[] {
		const size = parent1.length;
		const child = new Array<number>(size).fill(-1);
		const used = new Set<number>();

		let start = Math.floor(Math.random() * size);
		let end = Math.floor(Math.random() * size);

		if (start > end) [start, end] = [end, start];

		for (let i = start; i <= end; i++) {
			child[i] = parent1[i];
			used.add(parent1[i]);
		}

		let p2Index = 0;

		for (let i = 0; i < size; i++) {
			if (child[i] !== -1) continue;

			while (used.has(parent2[p2Index])) {
				p2Index++;
			}

			child[i] = parent2[p2Index++];
			used.add(child[i]);
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
			const conflictIndex = this.getFirstInvalidTransitionIndex(genes);

			for (let j = 0; j < swapsPerIndividual; j++) {
				const [a, b] = this.pickMutationSwapPair(genes.length, conflictIndex);

				[genes[a], genes[b]] = [genes[b], genes[a]];
			}

			chromosome.setSolution(genes);
			this.evaluateChromosome(chromosome);

			if ((index & 7) === 0) {
				await this.sleep(0);
			}
		}

		return false;
	}

	private getFirstInvalidTransitionIndex(solution: number[]): number {
		for (let i = 1; i < solution.length; i++) {
			if (!this.validMoves[solution[i - 1]][solution[i]]) {
				return i;
			}
		}

		return -1;
	}

	private pickMutationSwapPair(size: number, conflictIndex: number): [number, number] {
		const useGuidedMutation = conflictIndex >= 0 && Math.random() < 0.75;

		if (!useGuidedMutation) {
			const a = Math.floor(Math.random() * size);
			let b = Math.floor(Math.random() * size);
			while (b === a) b = Math.floor(Math.random() * size);
			return [a, b];
		}

		const focusStart = Math.max(0, conflictIndex - 2);
		const focusEnd = Math.min(size - 1, conflictIndex + 2);
		const a = focusStart + Math.floor(Math.random() * (focusEnd - focusStart + 1));

		const tailStart = Math.min(size - 1, conflictIndex + 1);
		let b = tailStart + Math.floor(Math.random() * (size - tailStart));
		if (b === a) b = Math.floor(Math.random() * size);
		while (b === a) b = Math.floor(Math.random() * size);

		return [a, b];
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

	// private fitness(chromosome: Chromosome): number {
	// 	return this.getLongestValidPathRange(chromosome.getSolution()).length;
	// }

// --------------  Score Básico + Média de Opções --------------
	// private fitness(chromosome: Chromosome): number {
	// 	const range = this.getLongestValidPathRange(chromosome.getSolution());
	// 	const pathLength = range.length;

	// 	// Para o caminho válido, calcular quantas opções cada posição tem
	// 	const avgOptions = this.getAverageOptionsInPath(
	// 		chromosome.getSolution(),
	// 		range.start,
	// 		pathLength
	// 	);

	// 	// Score = comprimento + bônus baseado em disponibilidade
	// 	// Ponder: 10*comprimento + 2*média_opções (assim comprimento domina mas opções desempata)
	// 	return pathLength * 10 + avgOptions * 2;
	// }


// ----------------------------- Penalizar Becos Sem Saída Forte (Mais agressivo)

// private fitness(chromosome: Chromosome): number {
//     const range = this.getLongestValidPathRange(chromosome.getSolution());
//     const pathLength = range.length;
//     const lastPositionInPath = chromosome.getSolution()[range.start + pathLength - 1];
    
//     // Contar opções da última posição
//     const lastPositionOptions = this.countValidMovesFrom(lastPositionInPath, -1);
    
//     // Se chegou num beco sem saída (-1 saída), grande penalidade
//     // Se tem opções, bônus proporcional
//     const terminationBonus = lastPositionOptions > 0 ? lastPositionOptions * 3 : -5;
    
//     return pathLength * 10 + terminationBonus;
// }


// ------------------------------ Score Estratificado com Depth (Mais sofisticado)-------------------------------
	private evaluateChromosome(chromosome: Chromosome): void {
		const [score, fitness] = this.fitness(chromosome);
		chromosome.setScore(score);
		chromosome.setFitness(fitness);
	}

	private fitness(chromosome: Chromosome): [score: number, fitness: number] {
		const range = this.getLongestValidPathRange(chromosome.getSolution());
		const score = range.length;

		let weightedOptions = 0;
		for (let i = 0; i < score; i++) {
			const position = chromosome.getSolution()[range.start + i];
			const options = this.countValidMovesFrom(position);
			const depth = i + 1;
			const weight = depth / score;
			weightedOptions += options * weight;
		}

		const fitness = score * 10 + weightedOptions * 1.5;
		return [score, fitness];
	}
//------------------------------ Score com Média de Opções ao Longo do Caminho (Balanceado) -------------------------------

	private getAverageOptionsInPath(solution: number[], start: number, length: number): number {
		if (length <= 1) return 0;

		let totalOptions = 0;
		for (let i = start; i < start + length; i++) {
			const position = solution[i];
			const options = this.countValidMovesFrom(position, i < start + length - 1 ? solution[i + 1] : -1);
			totalOptions += options;
		}

		return totalOptions / length;
	}

	private countValidMovesFrom(position: number, excludeNext: number = -1): number {
		let count = 0;
		for (let dest = 1; dest <= this.totalSquares; dest++) {
			if (dest !== excludeNext && this.validMoves[position][dest]) {
				count++;
			}
		}
		return count;
	}

//-------------------------------------------------------------

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
		const prefixFrequency = this.getPrefixFrequencyMap();

		this.population.sort((a, b) => {
			const adjustedFitnessDiff = this.getDiversityAdjustedFitness(b, prefixFrequency)
				- this.getDiversityAdjustedFitness(a, prefixFrequency);
			if (adjustedFitnessDiff !== 0) return adjustedFitnessDiff;

			const fitnessDiff = b.getFitness() - a.getFitness();
			if (fitnessDiff !== 0) return fitnessDiff;

			const scoreDiff = b.getScore() - a.getScore();
			if (scoreDiff !== 0) return scoreDiff;

			const prefixDiff = this.getValidPrefixLength(b.getSolution()) - this.getValidPrefixLength(a.getSolution());
			if (prefixDiff !== 0) return prefixDiff;

			return b.getAge() - a.getAge();
		});
	}

	private getPrefixFrequencyMap(): Map<string, number> {
		const frequency = new Map<string, number>();

		for (const chromosome of this.population) {
			const key = this.getDiversityPrefixKey(chromosome.getSolution());
			frequency.set(key, (frequency.get(key) ?? 0) + 1);
		}

		return frequency;
	}

	private getDiversityAdjustedFitness(chromosome: Chromosome, prefixFrequency: Map<string, number>): number {
		const key = this.getDiversityPrefixKey(chromosome.getSolution());
		const frequency = prefixFrequency.get(key) ?? 1;
		const penalty = Math.max(0, frequency - 1) * this.diversityPenaltyWeight;
		return chromosome.getFitness() - penalty;
	}

	private getDiversityPrefixKey(solution: number[]): string {
		const size = Math.min(this.diversityPrefixLength, solution.length);
		return solution.slice(0, size).join('-');
	}

	private calculateAverageFitness(): number {
		if (this.population.length === 0) return 0;
		const total = this.population.reduce((acc, c) => acc + c.getScore(), 0);
		return total / this.population.length;
	}

	private getAdaptivePlateauLimit(basePlateau: number, bestFitness: number): number {
		const safeBase = Math.max(1, basePlateau);
		const progress = Math.max(0, Math.min(1, bestFitness / this.totalSquares));
		const extra = Math.floor(safeBase * (1 - progress) * 2);
		return safeBase + extra;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GenerationService;
