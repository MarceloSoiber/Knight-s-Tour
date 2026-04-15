import type { IMutation } from './IMutation.ts';

class InversionMutation implements IMutation {
	mutate(genes: number[], swapsPerIndividual: number, conflictIndex: number): number[] {
		const nextGenes = [...genes];

		for (let i = 0; i < swapsPerIndividual; i++) {
			this.applyInversionMutation(nextGenes, conflictIndex);
		}

		return nextGenes;
	}

	private applyInversionMutation(genes: number[], conflictIndex: number): void {
		const size = genes.length;
		let start: number;
		let end: number;

		if (conflictIndex >= 0 && Math.random() < 0.75) {
			const focusStart = Math.max(0, conflictIndex - 3);
			const focusEnd = Math.min(size - 1, conflictIndex + 3);
			start = focusStart + Math.floor(Math.random() * (focusEnd - focusStart + 1));

			const tailStart = Math.min(size - 1, conflictIndex + 1);
			end = tailStart + Math.floor(Math.random() * (size - tailStart));
		} else {
			start = Math.floor(Math.random() * size);
			end = Math.floor(Math.random() * size);
		}

		if (start > end) {
			[start, end] = [end, start];
		}

		if (start === end) {
			end = (end + 1) % size;
			if (start > end) [start, end] = [end, start];
		}

		let left = start;
		let right = end;
		while (left < right) {
			const temp = genes[left];
			genes[left] = genes[right];
			genes[right] = temp;
			left++;
			right--;
		}
	}
}

export default InversionMutation;
