import type { GenerationCallbacks, GenerationConfig, GenerationResult } from '../model/types.ts';
import type { ISelection } from './selection/ISelection.ts';
import PopulationManager from './PopulationManager.ts';

class GAEngine {
	private readonly populationManager: PopulationManager;
	private readonly elitistSelection: ISelection;
	private readonly rotationSelection: ISelection;

	constructor(populationManager: PopulationManager, elitistSelection: ISelection, rotationSelection: ISelection) {
		this.populationManager = populationManager;
		this.elitistSelection = elitistSelection;
		this.rotationSelection = rotationSelection;
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		const cfg = this.normalizeConfig(config);
		const shouldStop = () => Boolean(callbacks.shouldStop && callbacks.shouldStop());

		await this.populationManager.initializePopulation(
			cfg.chromosomes,
			cfg.lifeExpectancy,
			cfg.activateLifeExpectancy,
			shouldStop
		);

		if (shouldStop()) {
			const best = this.populationManager.getBestChromosomeByScore();
			const bestScore = best?.getScore() ?? 0;
			const bestModelFitness = best?.getFitness() ?? 0;
			const avgScore = this.populationManager.size() > 0 ? this.populationManager.calculateAverageScore() : 0;
			const avgModelFitness = this.populationManager.size() > 0 ? this.populationManager.calculateAverageFitness() : 0;
			const top10AvgScore = this.populationManager.size() > 0 ? this.populationManager.calculateTopAverageScore(10) : 0;
			const medianScore = this.populationManager.size() > 0 ? this.populationManager.calculateMedianScore() : 0;
			return {
				generationsExecuted: 0,
				bestFitness: bestScore,
				avgFitness: avgScore,
				modelBestFitness: bestModelFitness,
				modelAvgFitness: avgModelFitness,
				top10AvgScore,
				medianScore,
				solution: best ? this.populationManager.extractValidPath(best.getSolution()) : [],
				stopped: true
			};
		}

		if (this.populationManager.isEmpty()) {
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
		this.populationManager.sort();

		let lastBestScore = this.populationManager.getBestChromosomeByScore()?.getScore() ?? 0;
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

			if (this.populationManager.isEmpty()) {
				stopped = true;
				break;
			}

			generation++;
			this.populationManager.sort();

			let best = this.populationManager.getBestChromosomeByScore();
			let bestScore = best?.getScore() ?? 0;
			let avgFitness = this.populationManager.calculateAverageScore();
			let modelBestFitness = best?.getFitness() ?? 0;
			let modelAvgFitness = this.populationManager.calculateAverageFitness();
			let top10AvgScore = this.populationManager.calculateTopAverageScore(10);
			let medianScore = this.populationManager.calculateMedianScore();

			if (bestScore === lastBestScore) {
				plateauCounter++;
			} else {
				lastBestScore = bestScore;
				plateauCounter = 0;
				currentMutationRate = cfg.mutationRate;
			}

			const reachedPlateau = plateauCounter > this.getAdaptivePlateauLimit(cfg.plateauGenerations, bestScore);
			let adaptiveMutationApplied = false;

			if (cfg.enableAdaptiveMutationOnPlateau && reachedPlateau) {
				const nextMutationRate = Math.max(cfg.mutationRate, cfg.plateauMutationRate);
				adaptiveMutationApplied = nextMutationRate > currentMutationRate;
				currentMutationRate = nextMutationRate;

				if (adaptiveMutationApplied) {
					plateauCounter = 0;
				}
			}

			if (cfg.enablePartialRestart && reachedPlateau && !adaptiveMutationApplied) {
				if (await this.populationManager.partialRestartWithElite(cfg, shouldStop)) {
					stopped = true;
					break;
				}

				plateauCounter = 0;
				currentMutationRate = cfg.mutationRate;

				if (this.populationManager.isEmpty()) {
					stopped = true;
					break;
				}

				this.populationManager.sort();
				best = this.populationManager.getBestChromosomeByScore();
				bestScore = best?.getScore() ?? 0;
				avgFitness = this.populationManager.calculateAverageScore();
				modelBestFitness = best?.getFitness() ?? 0;
				modelAvgFitness = this.populationManager.calculateAverageFitness();
				top10AvgScore = this.populationManager.calculateTopAverageScore(10);
				medianScore = this.populationManager.calculateMedianScore();
				lastBestScore = bestScore;
			}

			if (callbacks.onGeneration) {
				callbacks.onGeneration({
					generation,
					bestFitness: bestScore,
					avgFitness,
					modelBestFitness,
					modelAvgFitness,
					top10AvgScore,
					medianScore,
					chromosomeTotal: this.populationManager.size(),
					totalGenerations: cfg.generations
				});
			}

			if (bestScore === this.populationManager.getTotalSquares()) {
				break;
			}

			if ((generation & 7) === 0) {
				await this.sleep(0);
			}
		}

		if (this.populationManager.isEmpty()) {
			return {
				generationsExecuted: generation,
				bestFitness: 0,
				avgFitness: 0,
				solution: [],
				stopped
			};
		}

		this.populationManager.sort();
		const best = this.populationManager.getBestChromosomeByScore();
		const bestScore = best?.getScore() ?? 0;
		const avgFitness = this.populationManager.calculateAverageScore();
		const modelBestFitness = best?.getFitness() ?? 0;
		const modelAvgFitness = this.populationManager.calculateAverageFitness();
		const top10AvgScore = this.populationManager.calculateTopAverageScore(10);
		const medianScore = this.populationManager.calculateMedianScore();

		return {
			generationsExecuted: generation,
			bestFitness: bestScore,
			avgFitness,
			modelBestFitness,
			modelAvgFitness,
			top10AvgScore,
			medianScore,
			solution: best ? this.populationManager.extractValidPath(best.getSolution()) : [],
			stopped
		};
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

		this.populationManager.agePopulation(cfg.activateLifeExpectancy);
		this.populationManager.sort();
		if (this.populationManager.size() < 2) return false;

		const targetPopulationSize = cfg.chromosomes;
		const selectionCount = this.populationManager.getSelectionCount(cfg.selectionRate);
		const matingPool = this.populationManager.getSelectionPool(selectionCount, cfg.processingOption);
		if (matingPool.length < 2) return false;

		const eliteCount = Math.max(1, Math.min(targetPopulationSize, Math.floor(targetPopulationSize * 0.05)));
		const elites = this.populationManager.getTop(eliteCount);
		const offspringNeeded = Math.max(0, targetPopulationSize - elites.length);
		const pairCount = Math.max(1, Math.ceil(offspringNeeded / 2));
		const offspring = [] as typeof elites;
		const shuffledPool = cfg.processingOption === 'rotation'
			? [...matingPool].sort(() => Math.random() - 0.5)
			: matingPool;
		const selectionStrategy = this.getSelectionStrategy(cfg.processingOption);

		for (let i = 0; i < pairCount; i++) {
			if (shouldStop()) return true;

			const [father, mother] = selectionStrategy.pickPair(shuffledPool, i);
			const [child1, child2] = this.populationManager.generateOffspring(father, mother, cfg.crossoverRate);
			offspring.push(child1, child2);

			if ((i & 15) === 0) {
				await this.sleep(0);
			}
		}

		this.populationManager.setPopulation([...elites, ...offspring], targetPopulationSize);
		await this.populationManager.replenish(targetPopulationSize, shouldStop);
		if (shouldStop()) return true;

		if (await this.populationManager.mutate(effectiveMutationRate, cfg.seriesPerMutation, shouldStop)) {
			return true;
		}

		this.populationManager.applyLifeExpectancy(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
		await this.populationManager.replenish(targetPopulationSize, shouldStop);
		return false;
	}

	private getSelectionStrategy(mode: GenerationConfig['processingOption']): ISelection {
		return mode === 'elitist' ? this.elitistSelection : this.rotationSelection;
	}

	private normalizeConfig(config: Partial<GenerationConfig>): GenerationConfig {
		return {
			generations: config.generations ?? 1,
			chromosomes: config.chromosomes ?? 100,
			selectionRate: config.selectionRate ?? 50,
			crossoverRate: config.crossoverRate ?? 100,
			mutationRate: config.mutationRate ?? 15,
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

	private getAdaptivePlateauLimit(basePlateau: number, bestFitness: number): number {
		const safeBase = Math.max(1, basePlateau);
		const progress = Math.max(0, Math.min(1, bestFitness / this.populationManager.getTotalSquares()));
		const extra = Math.floor(safeBase * (1 - progress) * 2);
		return safeBase + extra;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GAEngine;
