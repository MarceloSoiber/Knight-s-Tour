// Knight's Tour com Algoritmo Genético

import GenerationController from './controller/GenerationController.js';

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
        this.currentGeneration = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.totalGenerations = 0;
        this.board = [];
        this.solution = [];
        this.knightPiece = null;
        this.animationSpeedPresets = [700, 450, 300, 150];
        this.generationController = new GenerationController(this.boardSize);
        this.initializeBoard();
        this.attachEventListeners();
    }

    initializeBoard() {
        const boardContainer = document.getElementById('chessBoard');
        const colLabelsContainer = document.getElementById('boardColLabels');
        const rowLabelsContainer = document.getElementById('boardRowLabels');

        boardContainer.innerHTML = '';
        if (colLabelsContainer) colLabelsContainer.innerHTML = '';
        if (rowLabelsContainer) rowLabelsContainer.innerHTML = '';

        for (let index = 0; index < this.boardSize; index++) {
            if (colLabelsContainer) {
                const colLabel = document.createElement('span');
                colLabel.className = 'board-axis-value';
                colLabel.textContent = String(index);
                colLabelsContainer.appendChild(colLabel);
            }

            if (rowLabelsContainer) {
                const rowLabel = document.createElement('span');
                rowLabel.className = 'board-axis-value';
                rowLabel.textContent = String(index);
                rowLabelsContainer.appendChild(rowLabel);
            }
        }
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const square = document.createElement('div');
                square.className = 'chess-square';
                square.id = `square-${i}-${j}`;
                
                // Alternado branco e preto
                if ((i + j) % 2 === 0) {
                    square.classList.add('white');
                } else {
                    square.classList.add('black');
                }
                
                square.dataset.row = i;
                square.dataset.col = j;
                
                boardContainer.appendChild(square);
            }
        }

        this.ensureKnightPiece();
    }

    ensureKnightPiece() {
        const boardContainer = document.getElementById('chessBoard');
        let piece = document.getElementById('knightPiece');

        if (!piece) {
            piece = document.createElement('div');
            piece.id = 'knightPiece';
            piece.className = 'knight-piece';
            piece.innerHTML = '<span class="knight-glyph" aria-hidden="true">&#9822;</span>';
            boardContainer.appendChild(piece);
        }

        piece.style.display = 'none';
        this.knightPiece = piece;
    }

    moveKnightToSquare(square, immediate = false) {
        if (!this.knightPiece || !square) return;

        const boardRect = document.getElementById('chessBoard').getBoundingClientRect();
        const squareRect = square.getBoundingClientRect();

        const centerX = squareRect.left - boardRect.left + squareRect.width / 2;
        const centerY = squareRect.top - boardRect.top + squareRect.height / 2;

        this.knightPiece.style.transition = immediate ? 'none' : 'left 0.25s ease, top 0.25s ease';
        this.knightPiece.style.display = 'flex';
        this.knightPiece.style.left = `${centerX}px`;
        this.knightPiece.style.top = `${centerY}px`;
    }

    attachEventListeners() {
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const prevStepBtn = document.getElementById('prevStepBtn');
        const nextStepBtn = document.getElementById('nextStepBtn');
        const speedSlider = document.getElementById('animationSpeed');
        
        startBtn.addEventListener('click', () => this.startEvolution());
        resetBtn.addEventListener('click', () => this.reset());

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (prevStepBtn) {
            prevStepBtn.addEventListener('click', () => this.stepBackward());
        }

        if (nextStepBtn) {
            nextStepBtn.addEventListener('click', () => this.stepForward());
        }

        if (speedSlider) {
            this.syncAnimationSpeedFromSlider();
            speedSlider.addEventListener('input', () => {
                this.syncAnimationSpeedFromSlider();
                if (this.isAnimatingPlayback && !this.isAnimationPaused) {
                    this.scheduleNextAutoStep();
                }
            });
        }

        this.setAnimationControlsState(false);
    }

    syncAnimationSpeedFromSlider() {
        const speedSlider = document.getElementById('animationSpeed');
        if (!speedSlider) return;

        const index = Math.max(0, Math.min(this.animationSpeedPresets.length - 1, Number(speedSlider.value) || 0));
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
        const config = this.getFormValues();
        
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = true;
        startBtn.textContent = 'Evoluindo...';
        
        this.totalGenerations = config.generations;

        const results = document.getElementById('results');
        results.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-hourglass-split"></i> Executando evolução genética...
            </div>
        `;

        const evolutionResult = await this.generationController.run(config, {
            onGeneration: (progress) => {
                this.currentGeneration = progress.generation;
                this.bestFitness = progress.bestFitness;
                this.avgFitness = progress.avgFitness;
                this.updateStats();
                this.updateProgressBar();
            }
        });

        this.solution = evolutionResult.solution;

        results.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-cpu"></i>
                Evolução concluída em ${evolutionResult.generationsExecuted} gerações. Melhor fitness: ${evolutionResult.bestFitness}/64
            </div>
        `;
        
        // Animar solução
        await this.animateSolution();
        
        startBtn.disabled = false;
        startBtn.textContent = 'Iniciar Evolução';
        this.isRunning = false;
    }

    async animateSolution() {
        const solutionPath = document.getElementById('solutionPath');
        const results = document.getElementById('results');
        const visitedSquares = document.getElementById('visitedSquares');
        
        this.stopAnimationPlayback(false);
        solutionPath.innerHTML = '';
        visitedSquares.textContent = '0/64';

        if (!this.solution || this.solution.length === 0) {
            this.setAnimationControlsState(false);
            results.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> Nenhum percurso válido encontrado.
                </div>
            `;
            return;
        }

        results.innerHTML = `
            <div class="alert alert-info mt-3">
                <i class="bi bi-play-circle"></i> Animando percurso: ${this.solution.length}/64 casas visitadas
            </div>
        `;

        this.solution.forEach((position) => {
            const pathSpan = document.createElement('span');
            pathSpan.className = 'path-step';
            pathSpan.textContent = `(${position.row},${position.col})`;
            solutionPath.appendChild(pathSpan);
        });

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
        const visitedSquares = document.getElementById('visitedSquares');
        const pathNodes = document.querySelectorAll('#solutionPath .path-step');

        document.querySelectorAll('.chess-square').forEach((sq) => {
            sq.classList.remove('visited', 'current');
            delete sq.dataset.position;
        });

        if (this.animationStep < 0) {
            if (this.knightPiece) {
                this.knightPiece.style.display = 'none';
            }
            visitedSquares.textContent = '0/64';
            pathNodes.forEach((node) => node.classList.remove('path-step-active'));
            return;
        }

        for (let i = 0; i <= this.animationStep; i++) {
            const { row, col } = this.solution[i];
            const square = document.getElementById(`square-${row}-${col}`);
            if (!square) continue;

            square.dataset.position = `${i + 1}`;
            if (i === this.animationStep) {
                square.classList.add('current');
                this.moveKnightToSquare(square, immediate);
            } else {
                square.classList.add('visited');
            }
        }

        visitedSquares.textContent = `${this.animationStep + 1}/64`;

        pathNodes.forEach((node, index) => {
            node.classList.toggle('path-step-active', index === this.animationStep);
        });
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
        const results = document.getElementById('results');
        if (!results) return;

        if (this.solution.length === 64) {
            results.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-trophy"></i> <strong>Solução encontrada!</strong><br>
                    Casas visitadas: <strong>${this.solution.length}/64</strong>
                </div>
            `;
        } else {
            results.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-emoji-frown"></i> <strong>Solução não encontrada.</strong><br>
                    Casas visitadas: <strong>${this.solution.length}/64</strong>
                </div>
            `;
        }
    }

    setAnimationControlsState(enabled) {
        const pauseBtn = document.getElementById('pauseBtn');
        const prevStepBtn = document.getElementById('prevStepBtn');
        const nextStepBtn = document.getElementById('nextStepBtn');
        const speedSelect = document.getElementById('animationSpeed');

        if (pauseBtn) pauseBtn.disabled = !enabled;
        if (prevStepBtn) prevStepBtn.disabled = !enabled;
        if (nextStepBtn) nextStepBtn.disabled = !enabled;
        if (speedSelect) speedSelect.disabled = !enabled;
    }

    updatePauseButton() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (!pauseBtn) return;

        if (this.isAnimationPaused) {
            pauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
        } else {
            pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
        }
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
        document.getElementById('currentGeneration').textContent = this.currentGeneration;
        document.getElementById('bestFitness').textContent = Math.floor(this.bestFitness);
        document.getElementById('avgFitness').textContent = Math.floor(this.avgFitness);
    }

    updateProgressBar() {
        const progress = (this.currentGeneration / this.totalGenerations) * 100;
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        
        progressBar.style.width = progress + '%';
        progressPercent.textContent = Math.floor(progress) + '%';
    }

    reset() {
        this.stopAnimationPlayback(true);

        this.currentGeneration = 0;
        this.bestFitness = 0;
        this.avgFitness = 0;
        this.solution = [];
        
        // Limpar tabuleiro
        document.querySelectorAll('.chess-square').forEach(sq => {
            sq.classList.remove('visited', 'current');
            delete sq.dataset.position;
        });

        if (this.knightPiece) {
            this.knightPiece.style.display = 'none';
        }
        
        // Resetar stats
        this.updateStats();
        
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        
        document.getElementById('visitedSquares').textContent = '0/64';
        document.getElementById('solutionPath').innerHTML = '<span class="text-muted">Aguardando resultado...</span>';
        document.getElementById('results').innerHTML = '<i class="bi bi-info-circle"></i> Aguardando início da evolução...';
        this.setAnimationControlsState(false);
        this.updatePauseButton();
    }
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    new KnightsTour();
});
