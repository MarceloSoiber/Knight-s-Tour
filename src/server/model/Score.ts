/**
 * Classe Score
 * Representa um score no algoritmo genetico do Knight's Tour para fins de analise e comparacao de solucoes
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
  private fitnessMedia: number;
  private geracao: number;
  private criadoEm: Date;
  private solucao: unknown[];

  // Campos de configuracao da execucao
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
    this.fitnessMedia = 0;
    this.geracao = 0;
    this.criadoEm = new Date();
    this.solucao = [];

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

  getFitnessMedia(): number {
    return this.fitnessMedia;
  }

  setFitnessMedia(fitnessMedia: number): void {
    this.fitnessMedia = Number(fitnessMedia) || 0;
  }

  getGeracao(): number {
    return this.geracao;
  }

  setGeracao(geracao: number): void {
    this.geracao = Number(geracao) || 0;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  setCriadoEm(criadoEm: string | Date): void {
    this.criadoEm = criadoEm instanceof Date ? criadoEm : new Date(criadoEm);
  }

  getSolucao(): unknown[] {
    return this.solucao;
  }

  setSolucao(solucao: unknown[]): void {
    this.solucao = Array.isArray(solucao) ? solucao : [];
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
      fitnessMedia: this.fitnessMedia,
      geracao: this.geracao,
      criadoEm: this.criadoEm,
      solucao: this.solucao,
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
