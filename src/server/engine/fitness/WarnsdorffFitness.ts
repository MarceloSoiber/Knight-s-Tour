import type Chromosome from '../../model/Chromosome.ts';
import KnightBoard from '../../domain/KnightBoard.ts';
import type { IFitness } from './IFitness.ts';

class WarnsdorffFitness implements IFitness {
	private readonly board: KnightBoard;

	constructor(board: KnightBoard) {
		this.board = board;
	}

	evaluate(chromosome: Chromosome): [score: number, fitness: number] {
		const solution = chromosome.getSolution();
		const range = this.board.getLongestValidPathRange(solution);
		const score = range.length;

		let warnsdorffScore = 0;
		for (let i = 0; i < score; i++) {
			const position = solution[range.start + i];
			const options = this.board.countValidMovesFrom(position);
			const depth = i + 1;
			const weight = depth / score;
			const warnsdorffHeuristic = 1 / (options + 1);
			warnsdorffScore += warnsdorffHeuristic * weight;
		}

		const fitness = score * 10 + warnsdorffScore * 5.0;
		return [score, fitness];
	}
}

export default WarnsdorffFitness;
