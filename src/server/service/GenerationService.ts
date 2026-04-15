import KnightBoard from '../domain/KnightBoard.ts';
import GAEngine from '../engine/GAEngine.ts';
import PopulationManager from '../engine/PopulationManager.ts';
import WarnsdorffFitness from '../engine/fitness/WarnsdorffFitness.ts';
import OrderCrossover from '../engine/crossover/OrderCrossover.ts';
import CompositeMutation from '../engine/mutation/CompositeMutation.ts';
import SwapMutation from '../engine/mutation/SwapMutation.ts';
import InversionMutation from '../engine/mutation/InversionMutation.ts';
import ElitistSelection from '../engine/selection/ElitistSelection.ts';
import RotationSelection from '../engine/selection/RotationSelection.ts';
import type { GenerationCallbacks, GenerationConfig, GenerationResult } from '../model/types.ts';

export type { GenerationCallbacks, GenerationConfig, GenerationResult } from '../model/types.ts';

class GenerationService {
	private readonly engine: GAEngine;

	constructor(boardSize: number = 8) {
		const board = new KnightBoard(boardSize);
		const fitnessStrategy = new WarnsdorffFitness(board);
		const crossoverStrategy = new OrderCrossover();
		const mutationStrategy = new CompositeMutation([
			new InversionMutation(),
			new SwapMutation()
		]);
		const populationManager = new PopulationManager(
			board,
			fitnessStrategy,
			crossoverStrategy,
			mutationStrategy
		);

		this.engine = new GAEngine(
			populationManager,
			new ElitistSelection(),
			new RotationSelection()
		);
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		return this.engine.run(config, callbacks);
	}
}

export default GenerationService;
