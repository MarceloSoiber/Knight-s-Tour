export type Coordinate = {
	row: number;
	col: number;
};

export type GenerationCallbacks = {
	shouldStop?: () => boolean;
	onGeneration?: (payload: {
		generation: number;
		bestFitness: number;
		avgFitness: number;
		modelBestFitness?: number;
		modelAvgFitness?: number;
		top10AvgScore?: number;
		medianScore?: number;
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
	modelBestFitness?: number;
	modelAvgFitness?: number;
	top10AvgScore?: number;
	medianScore?: number;
	solution: Coordinate[];
	stopped: boolean;
};
