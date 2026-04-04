// Knight's Tour com Algoritmo Genético

import GenerationController from './controller/GenerationController.js';
import BoardView from './view/BoardView.js';
import StatsView from './view/StatsView.js';
import PlaybackControlsView from './view/PlaybackControlsView.js';
import PopulationChartView from './view/PopulationChartView.js';

class KnightsTour {
    constructor() {
        this.boardSize = 8;
        this.isRunning = false;
        this.isAnimatingPlayback = false;
        this.isAnimationPaused = false;
        this.animationTimer = null;
        this.animationStep = -1;
        this.animationSpeedMs = 300;
        this.animationResolver = null;
        this.stopRequested = false;
        this.currentGeneration = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.totalGenerations = 0;
        this.solution = [];
        this.animationSpeedPresets = [700, 450, 300, 150];
        this.generationController = new GenerationController(this.boardSize);
        this.boardView = new BoardView(this.boardSize);
        this.statsView = new StatsView();
        this.populationChartView = new PopulationChartView();
        this.controlsView = new PlaybackControlsView();

        this.boardView.initializeBoard();
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.controlsView.bind({
            onStart: () => this.startEvolution(),
            onStop: () => this.requestStop(),
            onReset: () => this.reset(),
            onPause: () => this.togglePause(),
            onPrev: () => this.stepBackward(),
            onNext: () => this.stepForward(),
            onSpeedInput: () => {
                this.syncAnimationSpeedFromSlider();
                if (this.isAnimatingPlayback && !this.isAnimationPaused) {
                    this.scheduleNextAutoStep();
                }
            }
        });

        this.syncAnimationSpeedFromSlider();
        this.controlsView.setControlsEnabled(false);
        this.controlsView.setPauseButton(this.isAnimationPaused);
        this.controlsView.setStopEnabled(false);
    }

    requestStop() {
        if (!this.isRunning) return;
        this.stopRequested = true;
        this.controlsView.setStopEnabled(false);
    }

    syncAnimationSpeedFromSlider() {
        const index = Math.max(0, Math.min(this.animationSpeedPresets.length - 1, this.controlsView.getSpeedIndex()));
        this.animationSpeedMs = this.animationSpeedPresets[index];
    }

    getFormValues() {
        return {
            generations: parseInt(document.getElementById('generations').value),
            chromosomes: parseInt(document.getElementById('chromosomes').value),
            selectionRate: parseInt(document.getElementById('selectionRate').value),
            crossoverRate: parseInt(document.getElementById('crossoverRate').value),
            mutationRate: parseInt(document.getElementById('mutationRate').value),
            seriesPerMutation: parseInt(document.getElementById('seriesPerMutation').value),
            lifeExpectancy: parseInt(document.getElementById('lifeExpectancy').value),
            activateLifeExpectancy: document.getElementById('activateLifeExpectancy').checked,
            processingOption: document.querySelector('input[name="processingOption"]:checked').value
        };
    }

    async startEvolution() {
        
        if (this.isRunning) return;

        this.reset();
        
        this.isRunning = true;
        this.stopRequested = false;
        const config = this.getFormValues();
        this.controlsView.setStartRunning(true);
        this.controlsView.setStopEnabled(true);
        
        this.totalGenerations = config.generations;
        this.statsView.resetProgress();
        this.statsView.setProgress(0, this.totalGenerations);
        this.statsView.showRunning();

        const evolutionResult = await this.generationController.run(config, {
            shouldStop: () => this.stopRequested,
            onGeneration: (progress) => {
                this.currentGeneration = progress.generation;
                this.bestFitness = progress.bestFitness;
                this.avgFitness = progress.avgFitness;
                this.updateStats();
                this.updateProgressBar();
                this.updatePopulationChart(progress.chromosomeTotal);
            }
        });

        this.solution = evolutionResult.solution;
        this.statsView.showEvolutionCompleted(evolutionResult.generationsExecuted, evolutionResult.bestFitness);
        
        // Animar solução somente quando não houve parada manual
        if (!evolutionResult.stopped) {
            await this.animateSolution();
        }
        
        this.controlsView.setStartRunning(false);
        this.controlsView.setStopEnabled(false);
        this.isRunning = false;
    }

    async animateSolution() {
        this.stopAnimationPlayback(false);
        this.statsView.clearSolutionPath();
        this.statsView.setVisitedSquares(0, this.boardSize * this.boardSize);

        if (!this.solution || this.solution.length === 0) {
            this.setAnimationControlsState(false);
            this.statsView.showNoValidPath();
            return;
        }

        this.statsView.showAnimating(this.solution.length);
        this.statsView.setSolutionPath(this.solution);

        this.animationStep = -1;
        this.isAnimatingPlayback = true;
        this.isAnimationPaused = false;
        this.setAnimationControlsState(true);
        this.updatePauseButton();
        this.renderAnimationStep(true);

        return new Promise((resolve) => {
            this.animationResolver = resolve;
            this.scheduleNextAutoStep();
        });
    }

    scheduleNextAutoStep() {
        this.clearAnimationTimer();
        if (!this.isAnimatingPlayback || this.isAnimationPaused) return;

        if (this.animationStep >= this.solution.length - 1) {
            this.finishAnimationPlayback();
            return;
        }

        this.animationTimer = setTimeout(() => {
            this.stepForward(true);
            this.scheduleNextAutoStep();
        }, this.animationSpeedMs);
    }

    stepForward(fromAuto = false) {
        if (!this.solution || this.solution.length === 0) return;

        if (!fromAuto) {
            this.isAnimationPaused = true;
            this.updatePauseButton();
            this.clearAnimationTimer();
        }

        if (this.animationStep >= this.solution.length - 1) {
            this.finishAnimationPlayback();
            return;
        }

        this.animationStep += 1;
        this.renderAnimationStep(fromAuto ? this.animationStep === 0 : true);

        if (this.animationStep >= this.solution.length - 1) {
            this.finishAnimationPlayback();
        }
    }

    stepBackward() {
        if (!this.solution || this.solution.length === 0) return;

        this.isAnimationPaused = true;
        this.updatePauseButton();
        this.clearAnimationTimer();

        if (this.animationStep <= -1) return;

        this.animationStep -= 1;
        this.renderAnimationStep(true);
    }

    togglePause() {
        if (!this.isAnimatingPlayback && this.animationStep < this.solution.length - 1) {
            this.isAnimatingPlayback = true;
        }

        if (!this.solution || this.solution.length === 0) return;

        this.isAnimationPaused = !this.isAnimationPaused;
        this.updatePauseButton();

        if (this.isAnimationPaused) {
            this.clearAnimationTimer();
            return;
        }

        if (this.animationStep >= this.solution.length - 1) {
            this.isAnimationPaused = true;
            this.updatePauseButton();
            return;
        }

        this.isAnimatingPlayback = true;
        this.scheduleNextAutoStep();
    }

    renderAnimationStep(immediate = false) {
        if (this.animationStep < 0) {
            this.boardView.renderStep(this.solution, this.animationStep, immediate);
            this.statsView.setVisitedSquares(0, this.boardSize * this.boardSize);
            this.statsView.setActivePathStep(-1);
            return;
        }

        const visited = this.boardView.renderStep(this.solution, this.animationStep, immediate);
        this.statsView.setVisitedSquares(visited, this.boardSize * this.boardSize);
        this.statsView.setActivePathStep(this.animationStep);
    }

    finishAnimationPlayback() {
        this.clearAnimationTimer();
        this.isAnimatingPlayback = false;
        this.isAnimationPaused = true;
        this.updatePauseButton();
        this.setFinalAnimationResult();

        if (this.animationResolver) {
            this.animationResolver();
            this.animationResolver = null;
        }
    }

    setFinalAnimationResult() {
        this.statsView.showFinalResult(this.solution.length);
    }

    setAnimationControlsState(enabled) {
        this.controlsView.setControlsEnabled(enabled);
    }

    updatePauseButton() {
        this.controlsView.setPauseButton(this.isAnimationPaused);
    }

    clearAnimationTimer() {
        if (!this.animationTimer) return;
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
    }

    stopAnimationPlayback(resolvePromise = true) {
        this.clearAnimationTimer();
        this.isAnimatingPlayback = false;
        this.isAnimationPaused = false;
        this.animationStep = -1;

        if (resolvePromise && this.animationResolver) {
            this.animationResolver();
            this.animationResolver = null;
        }
    }

    updateStats() {
        this.statsView.setGenerationStats(this.currentGeneration, this.bestFitness, this.avgFitness);
    }

    updateProgressBar() {
        this.statsView.setProgress(this.currentGeneration, this.totalGenerations);
    }

    updatePopulationChart(chromosomeTotal) {
        this.populationChartView.update(this.currentGeneration, chromosomeTotal);
    }

    reset() {
        this.stopAnimationPlayback(true);

        this.currentGeneration = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.stopRequested = false;
        this.solution = [];
        this.boardView.clearBoardState();
        this.boardView.hideKnight();
        this.populationChartView.reset();
        
        // Resetar stats
        this.updateStats();
        this.statsView.resetOutput();
        this.setAnimationControlsState(false);
        this.controlsView.setStopEnabled(false);
        this.updatePauseButton();
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    new KnightsTour();
});
