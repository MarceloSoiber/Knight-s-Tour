/**
 * Classe Score
 * Representa um score no algoritmo genetico do Knight's Tour para fins de analise e comparacao de solucoes
 */
class Score {
    constructor(configForm = {}) {
        this.id = null;
        this.fitness = 0;
        this.fitnessMedia = 0;
        this.geracao = 0;
        this.criadoEm = new Date();
        this.solucao = [];

        // Campos de configuracao da execucao
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

    getId() {
        return this.id;
    }

    setId(id) {
        this.id = id;
    }

    getFitness() {
        return this.fitness;
    }

    setFitness(fitness) {
        this.fitness = Number(fitness) || 0;
    }

    getFitnessMedia() {
        return this.fitnessMedia;
    }

    setFitnessMedia(fitnessMedia) {
        this.fitnessMedia = Number(fitnessMedia) || 0;
    }

    getGeracao() {
        return this.geracao;
    }

    setGeracao(geracao) {
        this.geracao = Number(geracao) || 0;
    }

    getCriadoEm() {
        return this.criadoEm;
    }

    setCriadoEm(criadoEm) {
        this.criadoEm = criadoEm instanceof Date ? criadoEm : new Date(criadoEm);
    }

    getSolucao() {
        return this.solucao;
    }

    setSolucao(solucao) {
        this.solucao = Array.isArray(solucao) ? solucao : [];
    }

    getGenerations() {
        return this.generations;
    }

    setGenerations(generations) {
        this.generations = Number(generations) || 0;
    }

    getChromosomes() {
        return this.chromosomes;
    }

    setChromosomes(chromosomes) {
        this.chromosomes = Number(chromosomes) || 0;
    }

    getSelectionRate() {
        return this.selectionRate;
    }

    setSelectionRate(selectionRate) {
        this.selectionRate = Number(selectionRate) || 0;
    }

    getCrossoverRate() {
        return this.crossoverRate;
    }

    setCrossoverRate(crossoverRate) {
        this.crossoverRate = Number(crossoverRate) || 0;
    }

    getMutationRate() {
        return this.mutationRate;
    }

    setMutationRate(mutationRate) {
        this.mutationRate = Number(mutationRate) || 0;
    }

    getSeriesPerMutation() {
        return this.seriesPerMutation;
    }

    setSeriesPerMutation(seriesPerMutation) {
        this.seriesPerMutation = Number(seriesPerMutation) || 0;
    }

    getLifeExpectancy() {
        return this.lifeExpectancy;
    }

    setLifeExpectancy(lifeExpectancy) {
        this.lifeExpectancy = Number(lifeExpectancy) || 0;
    }

    getActivateLifeExpectancy() {
        return this.activateLifeExpectancy;
    }

    setActivateLifeExpectancy(activateLifeExpectancy) {
        this.activateLifeExpectancy = Boolean(activateLifeExpectancy);
    }

    getProcessingOption() {
        return this.processingOption;
    }

    setProcessingOption(processingOption) {
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
            processingOption: this.processingOption
        };
    }
}

export default Score;
