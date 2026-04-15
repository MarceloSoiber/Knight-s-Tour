import Chromosome from '../model/Chromosome.ts';
import KnightBoard from '../domain/KnightBoard.ts';
import type { GenerationConfig } from '../model/types.ts';
import type { IFitness } from './fitness/IFitness.ts';
import type { ICrossover } from './crossover/ICrossover.ts';
import type { IMutation } from './mutation/IMutation.ts';

class PopulationManager {
	private readonly board: KnightBoard;
	private readonly totalSquares: number;
	private readonly fitnessStrategy: IFitness;
	private readonly crossoverStrategy: ICrossover;
	private readonly mutationStrategy: IMutation;
	private readonly diversityPrefixLength: number;
	private readonly diversityPenaltyWeight: number;
	private population: Chromosome[];

	constructor(
		board: KnightBoard,
		fitnessStrategy: IFitness,
		crossoverStrategy: ICrossover,
		mutationStrategy: IMutation,
		diversityPenaltyWeight: number = 0.35
	) {
		this.board = board;
		this.totalSquares = board.getTotalSquares();
		this.fitnessStrategy = fitnessStrategy;
		this.crossoverStrategy = crossoverStrategy;
		this.mutationStrategy = mutationStrategy;
		this.diversityPenaltyWeight = diversityPenaltyWeight;
		this.diversityPrefixLength = Math.max(4, Math.floor(board.getBoardSize() * 0.75));
		this.population = [];
	}

	async initializePopulation(
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
		this.sort();
	}

	isEmpty(): boolean {
		return this.population.length === 0;
	}

	size(): number {
		return this.population.length;
	}

	getTotalSquares(): number {
		return this.totalSquares;
	}

	getBestChromosomeByScore(): Chromosome | null {
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

	sort(): void {
		const prefixFrequency = this.getPrefixFrequencyMap();

		this.population.sort((a, b) => {
			const adjustedFitnessDiff = this.getDiversityAdjustedFitness(b, prefixFrequency)
				- this.getDiversityAdjustedFitness(a, prefixFrequency);
			if (adjustedFitnessDiff !== 0) return adjustedFitnessDiff;

			const fitnessDiff = b.getFitness() - a.getFitness();
			if (fitnessDiff !== 0) return fitnessDiff;

			const scoreDiff = b.getScore() - a.getScore();
			if (scoreDiff !== 0) return scoreDiff;

			const prefixDiff = this.board.getValidPrefixLength(b.getSolution()) - this.board.getValidPrefixLength(a.getSolution());
			if (prefixDiff !== 0) return prefixDiff;

			return b.getAge() - a.getAge();
		});
	}

	calculateAverageFitness(): number {
		if (this.population.length === 0) return 0;
		const total = this.population.reduce((acc, chromosome) => acc + chromosome.getFitness(), 0);
		return total / this.population.length;
	}

	calculateAverageScore(): number {
		if (this.population.length === 0) return 0;
		const total = this.population.reduce((acc, chromosome) => acc + chromosome.getScore(), 0);
		return total / this.population.length;
	}

	calculateMedianScore(): number {
		if (this.population.length === 0) return 0;

		const sortedScores = this.population
			.map((chromosome) => chromosome.getScore())
			.sort((a, b) => a - b);

		const mid = Math.floor(sortedScores.length / 2);
		if ((sortedScores.length & 1) === 0) {
			return (sortedScores[mid - 1] + sortedScores[mid]) / 2;
		}

		return sortedScores[mid];
	}

	calculateTopAverageScore(topPercent: number = 10): number {
		if (this.population.length === 0) return 0;

		const boundedTopPercent = Math.max(1, Math.min(100, Number(topPercent) || 10));
		const topCount = Math.max(1, Math.ceil((this.population.length * boundedTopPercent) / 100));

		const topScores = this.population
			.map((chromosome) => chromosome.getScore())
			.sort((a, b) => b - a)
			.slice(0, topCount);

		const total = topScores.reduce((acc, score) => acc + score, 0);
		return total / topScores.length;
	}

	getSelectionCount(selectionRate: number): number {
		const boundedRate = Math.max(1, Math.min(100, Number(selectionRate) || 50));
		return Math.max(2, Math.floor((this.population.length * boundedRate) / 100));
	}

	getSelectionPool(selectionCount: number, mode: GenerationConfig['processingOption']): Chromosome[] {
		if (selectionCount >= this.population.length) {
			return [...this.population];
		}

		if (mode === 'elitist') {
			return this.population.slice(0, selectionCount);
		}

		const shuffled = [...this.population].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, selectionCount);
	}

	getTop(count: number): Chromosome[] {
		if (count <= 0) return [];
		return this.population.slice(0, Math.min(count, this.population.length));
	}

	setPopulation(population: Chromosome[], targetPopulationSize: number): void {
		this.population = population.slice(0, targetPopulationSize);
	}

	async replenish(targetPopulationSize: number, shouldStop?: () => boolean): Promise<void> {
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

	agePopulation(enabled: boolean): void {
		if (!enabled) return;

		for (const chromosome of this.population) {
			chromosome.setAge(chromosome.getAge() - 1);
		}
	}

	applyLifeExpectancy(lifeExpectancy: number, enabled: boolean): void {
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

	generateOffspring(father: Chromosome, mother: Chromosome, crossoverRate: number): [Chromosome, Chromosome] {
		const boundedRate = Math.max(0, Math.min(100, Number(crossoverRate) || 0));

		if (Math.random() * 100 >= boundedRate) {
			return [father.clone(), mother.clone()];
		}

		const child1Genes = this.crossoverStrategy.cross(father.getSolution(), mother.getSolution());
		const child2Genes = this.crossoverStrategy.cross(mother.getSolution(), father.getSolution());

		const child1 = new Chromosome(-2);
		child1.setSolution(child1Genes);
		this.evaluateChromosome(child1);

		const child2 = new Chromosome(-2);
		child2.setSolution(child2Genes);
		this.evaluateChromosome(child2);

		return [child1, child2];
	}

	async mutate(mutationRate: number, swapsPerIndividual: number, shouldStop?: () => boolean): Promise<boolean> {
		const normalizedRate = mutationRate / 100;
		if (normalizedRate <= 0 || swapsPerIndividual <= 0) return false;

		for (let i = 1; i < this.population.length; i++) {
			if (shouldStop && shouldStop()) return true;
			if (Math.random() > normalizedRate) continue;

			const chromosome = this.population[i];
			const genes = chromosome.getSolution();
			const conflictIndex = this.getFirstInvalidTransitionIndex(genes);
			const mutatedGenes = this.mutationStrategy.mutate(genes, swapsPerIndividual, conflictIndex);

			chromosome.setSolution(mutatedGenes);
			this.evaluateChromosome(chromosome);

			if ((i % 50) === 0) {
				await this.sleep(0);
			}
		}

		return false;
	}

	async partialRestartWithElite(cfg: GenerationConfig, shouldStop?: () => boolean): Promise<boolean> {
		if (this.population.length === 0) return false;
		if (shouldStop && shouldStop()) return true;

		this.sort();

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
		this.sort();
		return false;
	}

	extractValidPath(solution: number[]) {
		return this.board.extractValidPath(solution);
	}

	private evaluateChromosome(chromosome: Chromosome): void {
		const [score, fitness] = this.fitnessStrategy.evaluate(chromosome);
		chromosome.setScore(score);
		chromosome.setFitness(fitness);
	}

	private createRandomGenes(): number[] {
		const genes = Array.from({ length: this.totalSquares }, (_, i) => i + 1);

		for (let i = genes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[genes[i], genes[j]] = [genes[j], genes[i]];
		}

		return genes;
	}

	private getFirstInvalidTransitionIndex(solution: number[]): number {
		for (let i = 1; i < solution.length; i++) {
			if (!this.board.isValidMove(solution[i - 1], solution[i])) {
				return i;
			}
		}

		return -1;
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

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default PopulationManager;
