class StatsView {
    constructor() {
        this.currentGenerationEl = document.getElementById('currentGeneration');
        this.bestFitnessEl = document.getElementById('bestFitness');
        this.avgFitnessEl = document.getElementById('avgFitness');
        this.bestModelFitnessEl = document.getElementById('bestModelFitness');
        this.avgModelFitnessEl = document.getElementById('avgModelFitness');
        this.top10AvgScoreEl = document.getElementById('top10AvgScore');
        this.medianScoreEl = document.getElementById('medianScore');
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

    setScoresLoading(message = 'Loading history...') {
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
            this.scoresTableBodyEl.innerHTML = '<tr><td colspan="13" class="text-center text-muted py-3">No data to display.</td></tr>';
            return;
        }

        rows.forEach((row) => {
            const tr = document.createElement('tr');
            const values = [
                this.formatDateValue(row.createdAt),
                this.formatNumericValue(row.fitness),
                this.formatNumericValue(row.averageFitness),
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
            const actionGroup = document.createElement('div');
            actionGroup.className = 'score-action-group';

            const applyButton = document.createElement('button');
            applyButton.type = 'button';
            applyButton.className = 'btn btn-sm btn-outline-primary score-apply-btn';
            applyButton.dataset.scoreId = String(row.id);
            applyButton.innerHTML = '<i class="bi bi-play-circle"></i>';
            applyButton.title = 'Apply score to board';

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'btn btn-sm btn-outline-danger score-delete-btn';
            removeButton.dataset.scoreId = String(row.id);
            removeButton.innerHTML = '<i class="bi bi-trash"></i>';
            removeButton.title = 'Remove score';

            actionGroup.appendChild(applyButton);
            actionGroup.appendChild(removeButton);
            actionCell.appendChild(actionGroup);
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

        return date.toLocaleString('en-US');
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
        this.saveScoreBtn.innerHTML = '<i class="bi bi-save"></i> Save data';
    }

    setGenerationStats(currentGeneration, bestFitness, avgFitness, metrics = {}) {
        const bestModelFitness = Number(metrics.modelBestFitness) || bestFitness;
        const avgModelFitness = Number(metrics.modelAvgFitness) || avgFitness;
        const top10AvgScore = Number(metrics.top10AvgScore) || avgFitness;
        const medianScore = Number(metrics.medianScore) || avgFitness;

        if (this.currentGenerationEl) this.currentGenerationEl.textContent = String(currentGeneration);

        if (this.bestFitnessEl) this.bestFitnessEl.textContent = String(Math.floor(bestFitness));
        if (this.avgFitnessEl) this.avgFitnessEl.textContent = String(Math.floor(avgFitness));
        if (this.bestModelFitnessEl) this.bestModelFitnessEl.textContent = String(Math.floor(bestModelFitness));
        if (this.avgModelFitnessEl) this.avgModelFitnessEl.textContent = String(Math.floor(avgModelFitness));

        if (this.avgFitnessEl) {
            this.avgFitnessEl.title = `Avg Score: ${Math.floor(avgFitness)} | Top10 Avg Score: ${Math.floor(top10AvgScore)} | Median Score: ${Math.floor(medianScore)}`;
        }

        if (this.top10AvgScoreEl) this.top10AvgScoreEl.textContent = String(Math.floor(top10AvgScore));
        if (this.medianScoreEl) this.medianScoreEl.textContent = String(Math.floor(medianScore));
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

    setResultStatus(message, variant = 'info', icon = 'info-circle') {
        if (!this.resultsEl) return;

        this.resultsEl.className = `status-banner status-banner-${variant}`;
        this.resultsEl.innerHTML = '';

        const iconEl = document.createElement('i');
        iconEl.className = `bi bi-${icon} status-banner-icon`;
        iconEl.setAttribute('aria-hidden', 'true');

        const textEl = document.createElement('span');
        textEl.className = 'status-banner-text';
        textEl.textContent = message;
        textEl.title = message;

        this.resultsEl.appendChild(iconEl);
        this.resultsEl.appendChild(textEl);
    }

    showRunning() {
        this.setResultStatus('Running genetic evolution...', 'warning', 'hourglass-split');
    }

    showEvolutionCompleted(generationsExecuted, bestFitness) {
        this.setResultStatus(
            `Evolution completed in ${generationsExecuted} generations. Best score: ${Math.floor(bestFitness)}/64`,
            'info',
            'cpu'
        );
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
            this.saveScoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Saving...';
            return;
        }

        if (this.saveScoreBtn.dataset.saved === 'true') {
            return;
        }

        this.saveScoreBtn.innerHTML = '<i class="bi bi-save"></i> Save data';
    }

    setSaveCompleted() {
        if (!this.saveScoreBtn) return;

        this.saveScoreBtn.dataset.saved = 'true';
        this.saveScoreBtn.disabled = true;
        this.saveScoreBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Data saved';
    }

    setSaveStatus(message, variant = 'muted') {
        if (!this.saveScoreStatusEl) return;

        this.saveScoreStatusEl.className = `save-score-status text-${variant} mt-2`;
        this.saveScoreStatusEl.textContent = message;
    }

    showAnimating(solutionLength) {
        this.setResultStatus(`Animating path: ${solutionLength}/64 visited squares`, 'info', 'play-circle');
    }

    showNoValidPath() {
        this.setResultStatus('No valid path found.', 'warning', 'exclamation-triangle');
    }

    showFinalResult(solutionLength) {
        if (solutionLength === 64) {
            this.setResultStatus(`Solution found. Visited squares: ${solutionLength}/64`, 'success', 'trophy');
            return;
        }

        this.setResultStatus(`Solution not found. Visited squares: ${solutionLength}/64`, 'warning', 'emoji-frown');
    }

    clearSolutionPath() {
        if (this.solutionPathEl) {
            const tbody = this.solutionPathEl.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '';
            }
        }
    }

    setSolutionPath(solution) {
        if (!this.solutionPathEl) return;

        // Get the tbody element of the table
        const tbody = this.solutionPathEl.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        solution.forEach((position, index) => {
            const row = document.createElement('tr');
            row.className = 'path-step';
            row.innerHTML = `
                <td class="text-center solution-path-cell">${index + 1}</td>
                <td class="text-center solution-path-cell">${position.col}</td>
                <td class="text-center solution-path-cell">${position.row}</td>
            `;
            tbody.appendChild(row);
        });
    }

    setActivePathStep(step) {
        if (!this.solutionPathEl) return;

        const pathRows = this.solutionPathEl.querySelectorAll('tbody tr.path-step');
        pathRows.forEach((row, index) => {
            row.classList.toggle('table-active', index === step);
        });
    }

    resetOutput() {
        this.setVisitedSquares(0);
        this.resetProgress();
        this.resetSaveButton();
        this.setSaveStatus('Saving will be enabled when processing finishes.');

        if (this.solutionPathEl) {
            const tbody = this.solutionPathEl.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted small">Waiting for result...</td></tr>';
            }
        }

        this.setResultStatus('Waiting for evolution to start...', 'info', 'info-circle');
    }
}

export default StatsView;
