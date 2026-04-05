// Knight's Tour com Algoritmo Genético

import GenerationController from './controller/GenerationController.js';
import BoardView from './view/BoardView.js';
import StatsView from './view/StatsView.js';
import PlaybackControlsView from './view/PlaybackControlsView.js';
import PopulationChartView from './view/PopulationChartView.js';
import Score from './model/Score.js';

const SCORE_API_URL = 'http://localhost:3333/api/scores';

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
        this.currentConfig = null;
        this.historyScores = [];
        this.pendingScore = null;
        this.isScoreSaved = false;
        this.deleteScoreTargetId = null;
        this.animationSpeedPresets = [700, 450, 300, 150];
        this.generationController = new GenerationController(this.boardSize);
        this.boardView = new BoardView(this.boardSize);
        this.statsView = new StatsView();
        this.populationChartView = new PopulationChartView();
        this.controlsView = new PlaybackControlsView();

        this.deleteScoreModalEl = document.getElementById('deleteScoreModal');
        this.deleteScoreModalMessageEl = document.getElementById('deleteScoreModalMessage');
        this.deleteScoreCancelBtn = document.getElementById('deleteScoreCancelBtn');
        this.deleteScoreConfirmBtn = document.getElementById('deleteScoreConfirmBtn');

        this.boardView.initializeBoard();
        this.attachEventListeners();
        this.loadScoresFromDatabase();
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

        this.statsView.bindSave(() => this.saveScore());

        if (this.statsView.scoresTableBodyEl) {
            this.statsView.scoresTableBodyEl.addEventListener('click', (event) => {
                const applyButton = event.target.closest('.score-apply-btn');
                if (applyButton) {
                    const scoreId = Number(applyButton.dataset.scoreId);
                    this.applyScoreFromHistory(scoreId);
                    return;
                }

                const button = event.target.closest('.score-delete-btn');
                if (!button) return;

                const scoreId = Number(button.dataset.scoreId);
                this.promptRemoveScore(scoreId);
            });
        }

        if (this.deleteScoreConfirmBtn) {
            this.deleteScoreConfirmBtn.addEventListener('click', () => {
                if (!this.deleteScoreTargetId) return;
                this.removeScore(this.deleteScoreTargetId);
            });
        }

        if (this.deleteScoreCancelBtn) {
            this.deleteScoreCancelBtn.addEventListener('click', () => this.closeDeleteScoreModal());
        }

        if (this.deleteScoreModalEl) {
            this.deleteScoreModalEl.addEventListener('click', (event) => {
                if (event.target?.dataset?.modalClose !== undefined) {
                    this.closeDeleteScoreModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.deleteScoreModalEl?.classList.contains('is-visible')) {
                this.closeDeleteScoreModal();
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
        this.currentConfig = config;
        this.pendingScore = null;
        this.isScoreSaved = false;
        this.controlsView.setStartRunning(true);
        this.controlsView.setStopEnabled(true);
        this.statsView.resetSaveButton();
        this.statsView.setSaveStatus('O salvamento será liberado ao final do processamento.');
        
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
        this.preparePendingScore(config, evolutionResult);

        if (!evolutionResult.stopped) {
            this.statsView.setSaveEnabled(true);
            this.statsView.setSaveStatus('Processamento finalizado. Você já pode salvar os dados.', 'success');
        }
        
        // Animar solução somente quando não houve parada manual
        if (!evolutionResult.stopped) {
            await this.animateSolution();
        } else {
            this.statsView.setSaveEnabled(false);
            this.statsView.setSaveStatus('Processamento interrompido. O salvamento foi desabilitado.', 'warning');
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

    preparePendingScore(config, evolutionResult) {
        const score = new Score(config);
        score.setFitness(evolutionResult.bestFitness);
        score.setFitnessMedia(evolutionResult.avgFitness);
        score.setGeracao(evolutionResult.generationsExecuted);
        score.setCriadoEm(new Date());
        score.setSolucao(evolutionResult.solution);

        this.pendingScore = score;
        return score;
    }

    async saveScore(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!this.pendingScore) {
            this.statsView.setSaveStatus('Execute o processamento até o final antes de salvar.', 'warning');
            return;
        }

        this.statsView.setSaveLoading(true);
        this.statsView.setSaveStatus('Enviando dados para o servidor...', 'primary');

        try {
            const response = await fetch(SCORE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.pendingScore)
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'Falha ao salvar o score.');
            }

            this.statsView.setSaveStatus('Dados salvos com sucesso no SQLite.', 'success');
            this.statsView.setSaveCompleted();
            this.isScoreSaved = true;
            await this.loadScoresFromDatabase();
        } catch (error) {
            this.statsView.setSaveStatus(error instanceof Error ? error.message : 'Erro inesperado ao salvar.', 'danger');
        } finally {
            this.statsView.setSaveLoading(false);
            if (this.pendingScore && !this.isScoreSaved) {
                this.statsView.setSaveEnabled(true);
            }
        }
    }

    async loadScoresFromDatabase() {
        this.statsView.setScoresLoading('Carregando histórico do banco...');

        try {
            const response = await fetch(`${SCORE_API_URL}?limit=100`);
            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'Falha ao carregar histórico.');
            }

            const rows = Array.isArray(payload.data) ? payload.data : [];
            this.historyScores = rows;
            this.statsView.renderScoresTable(rows);
            this.statsView.setScoresStatus(`Total de registros: ${rows.length}`, 'success');
        } catch (error) {
            this.historyScores = [];
            this.statsView.renderScoresTable([]);
            this.statsView.setScoresError(error instanceof Error ? error.message : 'Erro ao buscar histórico.');
        }
    }

    normalizeStoredSolution(rawSolution) {
        if (!Array.isArray(rawSolution)) return [];

        if (rawSolution.length === 0) return [];

        // Suporta tanto formato coordenado [{row,col}] quanto sequencia [1..64].
        if (typeof rawSolution[0] === 'number') {
            return rawSolution
                .map((position) => Number(position))
                .filter((position) => Number.isInteger(position) && position > 0 && position <= this.boardSize * this.boardSize)
                .map((position) => {
                    const index = position - 1;
                    return {
                        row: Math.floor(index / this.boardSize),
                        col: index % this.boardSize
                    };
                });
        }

        return rawSolution
            .map((step) => ({
                row: Number(step?.row),
                col: Number(step?.col)
            }))
            .filter((step) => Number.isInteger(step.row)
                && Number.isInteger(step.col)
                && step.row >= 0
                && step.row < this.boardSize
                && step.col >= 0
                && step.col < this.boardSize);
    }

    async applyScoreFromHistory(scoreId) {
        if (this.isRunning) {
            this.statsView.setScoresError('Aguarde o processamento atual finalizar para aplicar um score.');
            return;
        }

        if (!Number.isInteger(scoreId) || scoreId <= 0) {
            this.statsView.setScoresError('ID de score inválido.');
            return;
        }

        const score = this.historyScores.find((item) => Number(item.id) === scoreId);
        if (!score) {
            this.statsView.setScoresError('Score não encontrado na lista atual.');
            return;
        }

        const solution = this.normalizeStoredSolution(score.solucao);
        if (solution.length === 0) {
            this.statsView.setScoresError('Este score não possui uma solução válida para exibir.');
            return;
        }

        this.stopAnimationPlayback(true);

        this.solution = solution;
        this.currentGeneration = Number(score.geracao) || 0;
        this.bestFitness = Number(score.fitness) || 0;
        this.avgFitness = Number(score.fitnessMedia) || 0;
        this.totalGenerations = Number(score.generations) || Math.max(1, this.currentGeneration);

        this.updateStats();
        this.statsView.setProgress(this.currentGeneration, this.totalGenerations);
        this.statsView.setSaveStatus('Score aplicado do histórico.', 'info');
        this.statsView.setSaveEnabled(false);

        await this.animateSolution();
        this.statsView.setScoresStatus(`Score ${scoreId} aplicado ao tabuleiro.`, 'success');
    }

    promptRemoveScore(scoreId) {
        if (!Number.isInteger(scoreId) || scoreId <= 0) {
            this.statsView.setScoresError('ID de score inválido.');
            return;
        }

        this.deleteScoreTargetId = scoreId;

        if (this.deleteScoreModalMessageEl) {
            this.deleteScoreModalMessageEl.textContent = `Tem certeza que deseja remover o score #${scoreId} do histórico?`;
        }

        this.openDeleteScoreModal();
    }

    openDeleteScoreModal() {
        if (!this.deleteScoreModalEl) return;

        this.deleteScoreModalEl.classList.add('is-visible');
        this.deleteScoreModalEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeDeleteScoreModal() {
        if (!this.deleteScoreModalEl) return;

        this.deleteScoreModalEl.classList.remove('is-visible');
        this.deleteScoreModalEl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.deleteScoreTargetId = null;
    }

    async removeScore(scoreId) {
        if (!Number.isInteger(scoreId) || scoreId <= 0) {
            this.statsView.setScoresError('ID de score inválido.');
            return;
        }

        this.closeDeleteScoreModal();

        try {
            if (this.deleteScoreConfirmBtn) {
                this.deleteScoreConfirmBtn.disabled = true;
                this.deleteScoreConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Removendo...';
            }

            const response = await fetch(`${SCORE_API_URL}/${scoreId}`, {
                method: 'DELETE'
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'Falha ao remover o score.');
            }

            await this.loadScoresFromDatabase();
            this.statsView.setScoresStatus(`Score ${scoreId} removido com sucesso.`, 'success');
        } catch (error) {
            this.statsView.setScoresError(error instanceof Error ? error.message : 'Erro inesperado ao remover score.');
        } finally {
            if (this.deleteScoreConfirmBtn) {
                this.deleteScoreConfirmBtn.disabled = false;
                this.deleteScoreConfirmBtn.innerHTML = '<i class="bi bi-trash"></i>';
            }
        }
    }

    reset() {
        this.stopAnimationPlayback(true);

        this.currentGeneration = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.stopRequested = false;
        this.solution = [];
        this.currentConfig = null;
        this.pendingScore = null;
        this.isScoreSaved = false;
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
