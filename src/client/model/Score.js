/**
 * Score model
 * Represents a Knight's Tour genetic algorithm run score for analysis and comparison.
 */
class Score {
    constructor(configForm = {}) {
        this.id = null;
        this.fitness = 0;
        this.averageFitness = 0;
        this.generation = 0;
        this.createdAt = new Date();
        this.solution = [];

        // Execution configuration fields
        this.generations = Number(configForm.generations) || 0;
        this.chromosomes = Number(configForm.chromosomes) || 0;
        this.selectionRate = Number(configForm.selectionRate) || 0;
        this.crossoverRate = Number(configForm.crossoverRate) || 0;
        this.mutationRate = Number(configForm.mutationRate) || 0;
        this.seriesPerMutation = Number(configForm.seriesPerMutation) || 0;
        this.lifeExpectancy = Number(configForm.lifeExpectancy) || 0;
        this.activateLifeExpectancy = Boolean(configForm.activateLifeExpectancy);
        this.processingOption = configForm.processingOption || 'rotation';
        this.enableAdaptiveMutationOnPlateau = Boolean(configForm.enableAdaptiveMutationOnPlateau);
        this.plateauMutationRate = Number(configForm.plateauMutationRate) || 0;
        this.enablePartialRestart = Boolean(configForm.enablePartialRestart);
        this.plateauGenerations = Number(configForm.plateauGenerations) || 0;
        this.restartEliteCount = Number(configForm.restartEliteCount) || 0;
        this.restartPopulationRate = Number(configForm.restartPopulationRate) || 0;

        // Distribution and model metrics persisted with the run.
        this.modelBestFitness = Number(configForm.modelBestFitness) || 0;
        this.modelAvgFitness = Number(configForm.modelAvgFitness) || 0;
        this.top10AvgScore = Number(configForm.top10AvgScore) || 0;
        this.medianScore = Number(configForm.medianScore) || 0;
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

    getAverageFitness() {
        return this.averageFitness;
    }

    setAverageFitness(averageFitness) {
        this.averageFitness = Number(averageFitness) || 0;
    }

    getGeneration() {
        return this.generation;
    }

    setGeneration(generation) {
        this.generation = Number(generation) || 0;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    setCreatedAt(createdAt) {
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    }

    getSolution() {
        return this.solution;
    }

    setSolution(solution) {
        this.solution = Array.isArray(solution) ? solution : [];
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

    getEnableAdaptiveMutationOnPlateau() {
        return this.enableAdaptiveMutationOnPlateau;
    }

    setEnableAdaptiveMutationOnPlateau(enableAdaptiveMutationOnPlateau) {
        this.enableAdaptiveMutationOnPlateau = Boolean(enableAdaptiveMutationOnPlateau);
    }

    getPlateauMutationRate() {
        return this.plateauMutationRate;
    }

    setPlateauMutationRate(plateauMutationRate) {
        this.plateauMutationRate = Number(plateauMutationRate) || 0;
    }

    getEnablePartialRestart() {
        return this.enablePartialRestart;
    }

    setEnablePartialRestart(enablePartialRestart) {
        this.enablePartialRestart = Boolean(enablePartialRestart);
    }

    getPlateauGenerations() {
        return this.plateauGenerations;
    }

    setPlateauGenerations(plateauGenerations) {
        this.plateauGenerations = Number(plateauGenerations) || 0;
    }

    getRestartEliteCount() {
        return this.restartEliteCount;
    }

    setRestartEliteCount(restartEliteCount) {
        this.restartEliteCount = Number(restartEliteCount) || 0;
    }

    getRestartPopulationRate() {
        return this.restartPopulationRate;
    }

    setRestartPopulationRate(restartPopulationRate) {
        this.restartPopulationRate = Number(restartPopulationRate) || 0;
    }

    getModelBestFitness() {
        return this.modelBestFitness;
    }

    setModelBestFitness(modelBestFitness) {
        this.modelBestFitness = Number(modelBestFitness) || 0;
    }

    getModelAvgFitness() {
        return this.modelAvgFitness;
    }

    setModelAvgFitness(modelAvgFitness) {
        this.modelAvgFitness = Number(modelAvgFitness) || 0;
    }

    getTop10AvgScore() {
        return this.top10AvgScore;
    }

    setTop10AvgScore(top10AvgScore) {
        this.top10AvgScore = Number(top10AvgScore) || 0;
    }

    getMedianScore() {
        return this.medianScore;
    }

    setMedianScore(medianScore) {
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
            seriesPerMutation: this.seriesPerMutation,
            lifeExpectancy: this.lifeExpectancy,
            activateLifeExpectancy: this.activateLifeExpectancy,
            processingOption: this.processingOption,
            enableAdaptiveMutationOnPlateau: this.enableAdaptiveMutationOnPlateau,
            plateauMutationRate: this.plateauMutationRate,
            enablePartialRestart: this.enablePartialRestart,
            plateauGenerations: this.plateauGenerations,
            restartEliteCount: this.restartEliteCount,
            restartPopulationRate: this.restartPopulationRate,
            modelBestFitness: this.modelBestFitness,
            modelAvgFitness: this.modelAvgFitness,
            top10AvgScore: this.top10AvgScore,
            medianScore: this.medianScore
        };
    }
}

export default Score;
