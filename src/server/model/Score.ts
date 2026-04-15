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
  enableAdaptiveMutationOnPlateau?: boolean;
  plateauMutationRate?: number;
  seriesPerMutation?: number;
  lifeExpectancy?: number;
  activateLifeExpectancy?: boolean;
  processingOption?: string;
  enablePartialRestart?: boolean;
  plateauGenerations?: number;
  restartEliteCount?: number;
  restartPopulationRate?: number;
  modelBestFitness?: number;
  modelAvgFitness?: number;
  top10AvgScore?: number;
  medianScore?: number;
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
  private enableAdaptiveMutationOnPlateau: boolean;
  private plateauMutationRate: number;
  private seriesPerMutation: number;
  private lifeExpectancy: number;
  private activateLifeExpectancy: boolean;
  private processingOption: string;
  private enablePartialRestart: boolean;
  private plateauGenerations: number;
  private restartEliteCount: number;
  private restartPopulationRate: number;
  private modelBestFitness: number;
  private modelAvgFitness: number;
  private top10AvgScore: number;
  private medianScore: number;

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
    this.enableAdaptiveMutationOnPlateau = Boolean(configForm.enableAdaptiveMutationOnPlateau);
    this.plateauMutationRate = Number(configForm.plateauMutationRate) || 0;
    this.seriesPerMutation = Number(configForm.seriesPerMutation) || 0;
    this.lifeExpectancy = Number(configForm.lifeExpectancy) || 0;
    this.activateLifeExpectancy = Boolean(configForm.activateLifeExpectancy);
    this.processingOption = configForm.processingOption || 'rotation';
    this.enablePartialRestart = Boolean(configForm.enablePartialRestart);
    this.plateauGenerations = Number(configForm.plateauGenerations) || 0;
    this.restartEliteCount = Number(configForm.restartEliteCount) || 0;
    this.restartPopulationRate = Number(configForm.restartPopulationRate) || 0;
    this.modelBestFitness = Number(configForm.modelBestFitness) || 0;
    this.modelAvgFitness = Number(configForm.modelAvgFitness) || 0;
    this.top10AvgScore = Number(configForm.top10AvgScore) || 0;
    this.medianScore = Number(configForm.medianScore) || 0;
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

  getEnableAdaptiveMutationOnPlateau(): boolean {
    return this.enableAdaptiveMutationOnPlateau;
  }

  setEnableAdaptiveMutationOnPlateau(enableAdaptiveMutationOnPlateau: boolean): void {
    this.enableAdaptiveMutationOnPlateau = Boolean(enableAdaptiveMutationOnPlateau);
  }

  getPlateauMutationRate(): number {
    return this.plateauMutationRate;
  }

  setPlateauMutationRate(plateauMutationRate: number): void {
    this.plateauMutationRate = Number(plateauMutationRate) || 0;
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

  getEnablePartialRestart(): boolean {
    return this.enablePartialRestart;
  }

  setEnablePartialRestart(enablePartialRestart: boolean): void {
    this.enablePartialRestart = Boolean(enablePartialRestart);
  }

  getPlateauGenerations(): number {
    return this.plateauGenerations;
  }

  setPlateauGenerations(plateauGenerations: number): void {
    this.plateauGenerations = Number(plateauGenerations) || 0;
  }

  getRestartEliteCount(): number {
    return this.restartEliteCount;
  }

  setRestartEliteCount(restartEliteCount: number): void {
    this.restartEliteCount = Number(restartEliteCount) || 0;
  }

  getRestartPopulationRate(): number {
    return this.restartPopulationRate;
  }

  setRestartPopulationRate(restartPopulationRate: number): void {
    this.restartPopulationRate = Number(restartPopulationRate) || 0;
  }

  getModelBestFitness(): number {
    return this.modelBestFitness;
  }

  setModelBestFitness(modelBestFitness: number): void {
    this.modelBestFitness = Number(modelBestFitness) || 0;
  }

  getModelAvgFitness(): number {
    return this.modelAvgFitness;
  }

  setModelAvgFitness(modelAvgFitness: number): void {
    this.modelAvgFitness = Number(modelAvgFitness) || 0;
  }

  getTop10AvgScore(): number {
    return this.top10AvgScore;
  }

  setTop10AvgScore(top10AvgScore: number): void {
    this.top10AvgScore = Number(top10AvgScore) || 0;
  }

  getMedianScore(): number {
    return this.medianScore;
  }

  setMedianScore(medianScore: number): void {
    this.medianScore = Number(medianScore) || 0;
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
      enableAdaptiveMutationOnPlateau: this.enableAdaptiveMutationOnPlateau,
      plateauMutationRate: this.plateauMutationRate,
      seriesPerMutation: this.seriesPerMutation,
      lifeExpectancy: this.lifeExpectancy,
      activateLifeExpectancy: this.activateLifeExpectancy,
      processingOption: this.processingOption,
      enablePartialRestart: this.enablePartialRestart,
      plateauGenerations: this.plateauGenerations,
      restartEliteCount: this.restartEliteCount,
      restartPopulationRate: this.restartPopulationRate,
      modelBestFitness: this.modelBestFitness,
      modelAvgFitness: this.modelAvgFitness,
      top10AvgScore: this.top10AvgScore,
      medianScore: this.medianScore,
    };
  }
}

export default Score;
