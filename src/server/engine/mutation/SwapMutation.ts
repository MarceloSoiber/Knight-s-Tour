import type { IMutation } from './IMutation.ts';

class SwapMutation implements IMutation {
	mutate(genes: number[], swapsPerIndividual: number, conflictIndex: number): number[] {
		const nextGenes = [...genes];

		for (let i = 0; i < swapsPerIndividual; i++) {
			const [a, b] = this.pickMutationSwapPair(nextGenes.length, conflictIndex);
			const temp = nextGenes[a];
			nextGenes[a] = nextGenes[b];
			nextGenes[b] = temp;
		}

		return nextGenes;
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
}

export default SwapMutation;
