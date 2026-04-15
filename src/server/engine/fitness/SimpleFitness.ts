import type Chromosome from '../../model/Chromosome.ts';
import KnightBoard from '../../domain/KnightBoard.ts';
import type { IFitness } from './IFitness.ts';

class SimpleFitness implements IFitness {
	private readonly board: KnightBoard;

	constructor(board: KnightBoard) {
		this.board = board;
	}

	evaluate(chromosome: Chromosome): [score: number, fitness: number] {
		const solution = chromosome.getSolution();
		const range = this.board.getLongestValidPathRange(solution);
		const score = range.length;

		const genes = chromosome.getSolution();
		if (!genes || genes.length === 0) return [0, 0];

		let total = 0;
		for (let i = 1; i < genes.length; i++) {
			if (this.board.isValidMove(genes[i - 1], genes[i])) {
				total += 1;
			}
		}

		// Mirrors the Java rule that always adds one for the last element.
		total += 1;
		return [score, total];
	}

	
}

export default SimpleFitness;
