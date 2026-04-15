import type { Coordinate } from '../model/types.ts';

class KnightBoard {
	private readonly boardSize: number;
	private readonly totalSquares: number;
	private readonly validMoves: boolean[][];

	constructor(boardSize: number) {
		this.boardSize = boardSize;
		this.totalSquares = boardSize * boardSize;
		this.validMoves = this.createValidMovesMatrix();
	}

	getBoardSize(): number {
		return this.boardSize;
	}

	getTotalSquares(): number {
		return this.totalSquares;
	}

	convertPositionToCoordinate(position: number): Coordinate {
		const index = position - 1;
		return {
			row: Math.floor(index / this.boardSize),
			col: index % this.boardSize
		};
	}

	isValidMove(from: number, to: number): boolean {
		if (from < 1 || from > this.totalSquares || to < 1 || to > this.totalSquares) {
			return false;
		}

		return this.validMoves[from][to];
	}

	countValidMovesFrom(position: number, excludeNext: number = -1): number {
		let count = 0;
		for (let destination = 1; destination <= this.totalSquares; destination++) {
			if (destination !== excludeNext && this.validMoves[position][destination]) {
				count++;
			}
		}

		return count;
	}

	getValidMoves(position: number, excludeNext: number = -1): number[] {
		const moves: number[] = [];

		for (let destination = 1; destination <= this.totalSquares; destination++) {
			if (destination !== excludeNext && this.validMoves[position][destination]) {
				moves.push(destination);
			}
		}

		return moves;
	}

	getValidPrefixLength(solution: number[]): number {
		if (solution.length === 0) return 0;

		let length = 1;

		for (let i = 1; i < solution.length; i++) {
			if (this.isValidMove(solution[i - 1], solution[i])) {
				length++;
			} else {
				break;
			}
		}

		return length;
	}

	getLongestValidPathRange(solution: number[]): { start: number; length: number } {
		if (solution.length === 0) {
			return { start: 0, length: 0 };
		}

		let bestStart = 0;
		let bestLength = 1;
		let currentStart = 0;
		let currentLength = 1;

		for (let i = 1; i < solution.length; i++) {
			if (this.isValidMove(solution[i - 1], solution[i])) {
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

	extractValidPath(solution: number[]): Coordinate[] {
		const range = this.getLongestValidPathRange(solution);
		return solution
			.slice(range.start, range.start + range.length)
			.map((position) => this.convertPositionToCoordinate(position));
	}

	private createValidMovesMatrix(): boolean[][] {
		const matrix = Array.from({ length: this.totalSquares + 1 }, () =>
			new Array<boolean>(this.totalSquares + 1).fill(false)
		);

		for (let origin = 1; origin <= this.totalSquares; origin++) {
			const from = this.convertPositionToCoordinate(origin);

			for (let destination = 1; destination <= this.totalSquares; destination++) {
				const to = this.convertPositionToCoordinate(destination);
				const rowDelta = Math.abs(from.row - to.row);
				const colDelta = Math.abs(from.col - to.col);

				matrix[origin][destination] = (rowDelta === 2 && colDelta === 1) || (rowDelta === 1 && colDelta === 2);
			}
		}

		return matrix;
	}
}

export default KnightBoard;
