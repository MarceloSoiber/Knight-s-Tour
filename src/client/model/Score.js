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
            processingOption: this.processingOption
        };
    }
}

export default Score;
