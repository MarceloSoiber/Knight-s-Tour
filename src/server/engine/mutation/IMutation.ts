export interface IMutation {
	mutate(genes: number[], swapsPerIndividual: number, conflictIndex: number): number[];
}
