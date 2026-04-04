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
        this.saveScoreBtn = document.getElementById('saveScoreBtn');
        this.saveScoreStatusEl = document.getElementById('saveScoreStatus');
        this.scoresTableBodyEl = document.getElementById('scoresTableBody');
        this.scoresTableStatusEl = document.getElementById('scoresTableStatus');
    }

    setScoresLoading(message = 'Carregando histórico...') {
        if (this.scoresTableStatusEl) {
            this.scoresTableStatusEl.className = 'scores-table-status text-muted mb-2';
            this.scoresTableStatusEl.textContent = message;
        }
    }

    setScoresError(message) {
        if (this.scoresTableStatusEl) {
            this.scoresTableStatusEl.className = 'scores-table-status text-danger mb-2';
            this.scoresTableStatusEl.textContent = message;
        }
    }

    setScoresStatus(message, variant = 'muted') {
        if (this.scoresTableStatusEl) {
            this.scoresTableStatusEl.className = `scores-table-status text-${variant} mb-2`;
            this.scoresTableStatusEl.textContent = message;
        }
    }

    renderScoresTable(rows) {
        if (!this.scoresTableBodyEl) return;

        this.scoresTableBodyEl.innerHTML = '';

        if (!Array.isArray(rows) || rows.length === 0) {
            this.scoresTableBodyEl.innerHTML = '<tr><td colspan="13" class="text-center text-muted py-3">Sem dados para exibir.</td></tr>';
            return;
        }

        rows.forEach((row) => {
            const tr = document.createElement('tr');
            const values = [
                this.formatDateValue(row.criadoEm),
                this.formatNumericValue(row.fitness),
                this.formatNumericValue(row.fitnessMedia),
                this.formatNumericValue(row.generations),
                this.formatNumericValue(row.chromosomes),
                this.formatNumericValue(row.selectionRate),
                this.formatNumericValue(row.crossoverRate),
                this.formatNumericValue(row.mutationRate),
                this.formatNumericValue(row.seriesPerMutation),
                this.formatNumericValue(row.lifeExpectancy),
                row.activateLifeExpectancy ? 'true' : 'false',
                row.processingOption || '-'
            ];

            values.forEach((value) => {
                const td = document.createElement('td');
                td.textContent = String(value);
                tr.appendChild(td);
            });

            const actionCell = document.createElement('td');
            const actionButton = document.createElement('button');
            actionButton.type = 'button';
            actionButton.className = 'btn btn-sm btn-outline-danger score-delete-btn';
            actionButton.dataset.scoreId = String(row.id);
            actionButton.innerHTML = '<i class="bi bi-trash"></i>';
            actionCell.appendChild(actionButton);
            tr.appendChild(actionCell);

            this.scoresTableBodyEl.appendChild(tr);
        });
    }

    formatNumericValue(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '-';

        return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
    }

    formatDateValue(value) {
        if (!value) return '-';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });
    }

    bindSave(onSave) {
        if (this.saveScoreBtn && onSave) {
            this.saveScoreBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                onSave(event);
            });
        }
    }

    resetSaveButton() {
        if (!this.saveScoreBtn) return;

        this.saveScoreBtn.dataset.saved = 'false';
        this.saveScoreBtn.disabled = true;
        this.saveScoreBtn.innerHTML = '<i class="bi bi-save"></i> Salvar dados';
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

    setSaveEnabled(enabled) {
        if (this.saveScoreBtn) {
            this.saveScoreBtn.disabled = !enabled;
        }
    }

    setSaveLoading(isLoading) {
        if (!this.saveScoreBtn) return;

        if (isLoading) {
            this.saveScoreBtn.disabled = true;
            this.saveScoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Salvando...';
            return;
        }

        if (this.saveScoreBtn.dataset.saved === 'true') {
            return;
        }

        this.saveScoreBtn.innerHTML = '<i class="bi bi-save"></i> Salvar dados';
    }

    setSaveCompleted() {
        if (!this.saveScoreBtn) return;

        this.saveScoreBtn.dataset.saved = 'true';
        this.saveScoreBtn.disabled = true;
        this.saveScoreBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Dados salvos';
    }

    setSaveStatus(message, variant = 'muted') {
        if (!this.saveScoreStatusEl) return;

        this.saveScoreStatusEl.className = `save-score-status text-${variant} mt-2`;
        this.saveScoreStatusEl.textContent = message;
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
        this.resetSaveButton();
        this.setSaveStatus('O salvamento será liberado ao final do processamento.');

        if (this.solutionPathEl) {
            this.solutionPathEl.innerHTML = '<span class="text-muted">Aguardando resultado...</span>';
        }

        if (this.resultsEl) {
            this.resultsEl.innerHTML = '<i class="bi bi-info-circle"></i> Aguardando início da evolução...';
        }
    }
}

export default StatsView;
