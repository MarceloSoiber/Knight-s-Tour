import type Chromosome from '../../model/Chromosome.ts';
import type { ISelection } from './ISelection.ts';

class RotationSelection implements ISelection {
	pickPair(population: Chromosome[], _pairIndex: number): [Chromosome, Chromosome] {
		const father = population[Math.floor(Math.random() * population.length)];
		if (population.length < 2) return [father, father];

		let mother = population[Math.floor(Math.random() * population.length)];
		while (mother === father) {
			mother = population[Math.floor(Math.random() * population.length)];
		}

		return [father, mother];
	}
}

export default RotationSelection;
