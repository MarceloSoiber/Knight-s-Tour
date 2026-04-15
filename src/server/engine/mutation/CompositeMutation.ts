import type { IMutation } from './IMutation.ts';

class CompositeMutation implements IMutation {
	private readonly strategies: IMutation[];

	constructor(strategies: IMutation[]) {
		this.strategies = strategies;
	}

	mutate(genes: number[], swapsPerIndividual: number, conflictIndex: number): number[] {
		if (this.strategies.length === 0) return [...genes];

		const strategy = this.strategies[Math.floor(Math.random() * this.strategies.length)];
		return strategy.mutate(genes, swapsPerIndividual, conflictIndex);
	}
}

export default CompositeMutation;
