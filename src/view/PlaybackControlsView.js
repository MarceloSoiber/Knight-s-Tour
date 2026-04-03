class PlaybackControlsView {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.prevStepBtn = document.getElementById('prevStepBtn');
        this.nextStepBtn = document.getElementById('nextStepBtn');
        this.speedSlider = document.getElementById('animationSpeed');
    }

    bind({ onStart, onReset, onPause, onPrev, onNext, onSpeedInput }) {
        if (this.startBtn && onStart) this.startBtn.addEventListener('click', onStart);
        if (this.resetBtn && onReset) this.resetBtn.addEventListener('click', onReset);
        if (this.pauseBtn && onPause) this.pauseBtn.addEventListener('click', onPause);
        if (this.prevStepBtn && onPrev) this.prevStepBtn.addEventListener('click', onPrev);
        if (this.nextStepBtn && onNext) this.nextStepBtn.addEventListener('click', onNext);
        if (this.speedSlider && onSpeedInput) this.speedSlider.addEventListener('input', onSpeedInput);
    }

    getSpeedIndex() {
        if (!this.speedSlider) return 0;
        return Number(this.speedSlider.value) || 0;
    }

    setStartRunning(isRunning) {
        if (!this.startBtn) return;

        this.startBtn.disabled = isRunning;
        this.startBtn.textContent = isRunning ? 'Evoluindo...' : 'Iniciar Evolução';
    }

    setControlsEnabled(enabled) {
        if (this.pauseBtn) this.pauseBtn.disabled = !enabled;
        if (this.prevStepBtn) this.prevStepBtn.disabled = !enabled;
        if (this.nextStepBtn) this.nextStepBtn.disabled = !enabled;
        if (this.speedSlider) this.speedSlider.disabled = !enabled;
    }

    setPauseButton(isPaused) {
        if (!this.pauseBtn) return;

        if (isPaused) {
            this.pauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Continuar';
        } else {
            this.pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pausar';
        }
    }
}

export default PlaybackControlsView;
