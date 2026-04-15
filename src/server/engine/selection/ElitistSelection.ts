import type Chromosome from '../../model/Chromosome.ts';
import type { ISelection } from './ISelection.ts';

class ElitistSelection implements ISelection {
	pickPair(population: Chromosome[], pairIndex: number): [Chromosome, Chromosome] {
		if (population.length < 2) {
			const single = population[0];
			return [single, single];
		}

		const father = population[(pairIndex * 2) % population.length];
		let mother = population[(pairIndex * 2 + 1) % population.length];

		if (mother === father) {
			mother = population[(pairIndex * 2 + 2) % population.length];
		}

		return [father, mother];
	}
}

export default ElitistSelection;
