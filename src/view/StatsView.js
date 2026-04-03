class StatsView {
    constructor() {
        this.currentGenerationEl = document.getElementById('currentGeneration');
        this.bestFitnessEl = document.getElementById('bestFitness');
        this.avgFitnessEl = document.getElementById('avgFitness');
        this.visitedSquaresEl = document.getElementById('visitedSquares');
        this.progressBarEl = document.getElementById('progressBar');
        this.progressPercentEl = document.getElementById('progressPercent');
        this.resultsEl = document.getElementById('results');
        this.solutionPathEl = document.getElementById('solutionPath');
    }

    setGenerationStats(currentGeneration, bestFitness, avgFitness) {
        if (this.currentGenerationEl) this.currentGenerationEl.textContent = String(currentGeneration);
        if (this.bestFitnessEl) this.bestFitnessEl.textContent = String(Math.floor(bestFitness));
        if (this.avgFitnessEl) this.avgFitnessEl.textContent = String(Math.floor(avgFitness));
    }

    setProgress(currentGeneration, totalGenerations) {
        const progress = totalGenerations > 0 ? (currentGeneration / totalGenerations) * 100 : 0;
        if (this.progressBarEl) this.progressBarEl.style.width = `${progress}%`;
        if (this.progressPercentEl) this.progressPercentEl.textContent = `${Math.floor(progress)}%`;
    }

    resetProgress() {
        if (this.progressBarEl) this.progressBarEl.style.width = '0%';
        if (this.progressPercentEl) this.progressPercentEl.textContent = '0%';
    }

    setVisitedSquares(visited, total = 64) {
        if (this.visitedSquaresEl) this.visitedSquaresEl.textContent = `${visited}/${total}`;
    }

    showRunning() {
        if (!this.resultsEl) return;

        this.resultsEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-hourglass-split"></i> Executando evolução genética...
            </div>
        `;
    }

    showEvolutionCompleted(generationsExecuted, bestFitness) {
        if (!this.resultsEl) return;

        this.resultsEl.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-cpu"></i>
                Evolução concluída em ${generationsExecuted} gerações. Melhor fitness: ${bestFitness}/64
            </div>
        `;
    }

    showAnimating(solutionLength) {
        if (!this.resultsEl) return;

        this.resultsEl.innerHTML = `
            <div class="alert alert-info mt-3">
                <i class="bi bi-play-circle"></i> Animando percurso: ${solutionLength}/64 casas visitadas
            </div>
        `;
    }

    showNoValidPath() {
        if (!this.resultsEl) return;

        this.resultsEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> Nenhum percurso válido encontrado.
            </div>
        `;
    }

    showFinalResult(solutionLength) {
        if (!this.resultsEl) return;

        if (solutionLength === 64) {
            this.resultsEl.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-trophy"></i> <strong>Solução encontrada!</strong><br>
                    Casas visitadas: <strong>${solutionLength}/64</strong>
                </div>
            `;
            return;
        }

        this.resultsEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-emoji-frown"></i> <strong>Solução não encontrada.</strong><br>
                Casas visitadas: <strong>${solutionLength}/64</strong>
            </div>
        `;
    }

    clearSolutionPath() {
        if (this.solutionPathEl) {
            this.solutionPathEl.innerHTML = '';
        }
    }

    setSolutionPath(solution) {
        if (!this.solutionPathEl) return;

        this.solutionPathEl.innerHTML = '';
        solution.forEach((position) => {
            const pathSpan = document.createElement('span');
            pathSpan.className = 'path-step';
            pathSpan.textContent = `(${position.row},${position.col})`;
            this.solutionPathEl.appendChild(pathSpan);
        });
    }

    setActivePathStep(step) {
        if (!this.solutionPathEl) return;

        const pathNodes = this.solutionPathEl.querySelectorAll('.path-step');
        pathNodes.forEach((node, index) => {
            node.classList.toggle('path-step-active', index === step);
        });
    }

    resetOutput() {
        this.setVisitedSquares(0);
        this.resetProgress();

        if (this.solutionPathEl) {
            this.solutionPathEl.innerHTML = '<span class="text-muted">Aguardando resultado...</span>';
        }

        if (this.resultsEl) {
            this.resultsEl.innerHTML = '<i class="bi bi-info-circle"></i> Aguardando início da evolução...';
        }
    }
}

export default StatsView;
