/**
 * Score model
 * Represents a Knight's Tour genetic algorithm run score for analysis and comparison.
 */

export type ScoreConfig = {
  generations?: number;
  chromosomes?: number;
  selectionRate?: number;
  crossoverRate?: number;
  mutationRate?: number;
  seriesPerMutation?: number;
  lifeExpectancy?: number;
  activateLifeExpectancy?: boolean;
  processingOption?: string;
};

class Score {
  private id: number | null;
  private fitness: number;
  private averageFitness: number;
  private generation: number;
  private createdAt: Date;
  private solution: unknown[];

  // Execution configuration fields
  private generations: number;
  private chromosomes: number;
  private selectionRate: number;
  private crossoverRate: number;
  private mutationRate: number;
  private seriesPerMutation: number;
  private lifeExpectancy: number;
  private activateLifeExpectancy: boolean;
  private processingOption: string;

  constructor(configForm: ScoreConfig = {}) {
    this.id = null;
    this.fitness = 0;
    this.averageFitness = 0;
    this.generation = 0;
    this.createdAt = new Date();
    this.solution = [];

    this.generations = Number(configForm.generations) || 0;
    this.chromosomes = Number(configForm.chromosomes) || 0;
    this.selectionRate = Number(configForm.selectionRate) || 0;
    this.crossoverRate = Number(configForm.crossoverRate) || 0;
    this.mutationRate = Number(configForm.mutationRate) || 0;
    this.seriesPerMutation = Number(configForm.seriesPerMutation) || 0;
    this.lifeExpectancy = Number(configForm.lifeExpectancy) || 0;
    this.activateLifeExpectancy = Boolean(configForm.activateLifeExpectancy);
    this.processingOption = configForm.processingOption || 'rotation';
  }

  getId(): number | null {
    return this.id;
  }

  setId(id: number | null): void {
    this.id = id;
  }

  getFitness(): number {
    return this.fitness;
  }

  setFitness(fitness: number): void {
    this.fitness = Number(fitness) || 0;
  }

  getAverageFitness(): number {
    return this.averageFitness;
  }

  setAverageFitness(averageFitness: number): void {
    this.averageFitness = Number(averageFitness) || 0;
  }

  getGeneration(): number {
    return this.generation;
  }

  setGeneration(generation: number): void {
    this.generation = Number(generation) || 0;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  setCreatedAt(createdAt: string | Date): void {
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
  }

  getSolution(): unknown[] {
    return this.solution;
  }

  setSolution(solution: unknown[]): void {
    this.solution = Array.isArray(solution) ? solution : [];
  }

  getGenerations(): number {
    return this.generations;
  }

  setGenerations(generations: number): void {
    this.generations = Number(generations) || 0;
  }

  getChromosomes(): number {
    return this.chromosomes;
  }

  setChromosomes(chromosomes: number): void {
    this.chromosomes = Number(chromosomes) || 0;
  }

  getSelectionRate(): number {
    return this.selectionRate;
  }

  setSelectionRate(selectionRate: number): void {
    this.selectionRate = Number(selectionRate) || 0;
  }

  getCrossoverRate(): number {
    return this.crossoverRate;
  }

  setCrossoverRate(crossoverRate: number): void {
    this.crossoverRate = Number(crossoverRate) || 0;
  }

  getMutationRate(): number {
    return this.mutationRate;
  }

  setMutationRate(mutationRate: number): void {
    this.mutationRate = Number(mutationRate) || 0;
  }

  getSeriesPerMutation(): number {
    return this.seriesPerMutation;
  }

  setSeriesPerMutation(seriesPerMutation: number): void {
    this.seriesPerMutation = Number(seriesPerMutation) || 0;
  }

  getLifeExpectancy(): number {
    return this.lifeExpectancy;
  }

  setLifeExpectancy(lifeExpectancy: number): void {
    this.lifeExpectancy = Number(lifeExpectancy) || 0;
  }

  getActivateLifeExpectancy(): boolean {
    return this.activateLifeExpectancy;
  }

  setActivateLifeExpectancy(activateLifeExpectancy: boolean): void {
    this.activateLifeExpectancy = Boolean(activateLifeExpectancy);
  }

  getProcessingOption(): string {
    return this.processingOption;
  }

  setProcessingOption(processingOption: string): void {
    this.processingOption = processingOption || 'rotation';
  }

  toJSON() {
    return {
      id: this.id,
      fitness: this.fitness,
      averageFitness: this.averageFitness,
      generation: this.generation,
      createdAt: this.createdAt,
      solution: this.solution,
      generations: this.generations,
      chromosomes: this.chromosomes,
      selectionRate: this.selectionRate,
      crossoverRate: this.crossoverRate,
      mutationRate: this.mutationRate,
      seriesPerMutation: this.seriesPerMutation,
      lifeExpectancy: this.lifeExpectancy,
      activateLifeExpectancy: this.activateLifeExpectancy,
      processingOption: this.processingOption,
    };
  }
}

export default Score;
