import type Chromosome from '../../model/Chromosome.ts';

export interface ISelection {
	pickPair(population: Chromosome[], pairIndex: number): [Chromosome, Chromosome];
}
