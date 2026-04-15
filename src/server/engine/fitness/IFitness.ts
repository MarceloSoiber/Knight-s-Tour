import type Chromosome from '../../model/Chromosome.ts';

export interface IFitness {
	evaluate(chromosome: Chromosome): [score: number, fitness: number];
}
