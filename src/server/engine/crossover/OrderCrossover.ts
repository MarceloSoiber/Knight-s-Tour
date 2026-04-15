import type { ICrossover } from './ICrossover.ts';

class OrderCrossover implements ICrossover {
	cross(parent1: number[], parent2: number[]): number[] {
		const size = parent1.length;
		const child = new Array<number>(size).fill(-1);

		let start = Math.floor(Math.random() * size);
		let end = Math.floor(Math.random() * size);
		if (start > end) [start, end] = [end, start];

		const used = new Set<number>();
		for (let i = start; i <= end; i++) {
			child[i] = parent1[i];
			used.add(parent1[i]);
		}

		let currentChildIdx = (end + 1) % size;
		let currentParentIdx = (end + 1) % size;

		for (let count = 0; count < size; count++) {
			const itemP2 = parent2[currentParentIdx];

			if (!used.has(itemP2)) {
				child[currentChildIdx] = itemP2;
				currentChildIdx = (currentChildIdx + 1) % size;
				used.add(itemP2);
			}

			currentParentIdx = (currentParentIdx + 1) % size;
		}

		return child;
	}
}

export default OrderCrossover;
