class PopulationChartView {
    constructor() {
        this.canvas = document.getElementById('populationChart');
        this.context = this.canvas ? this.canvas.getContext('2d') : null;
        this.history = [];
        this.maxPoints = 90;
        this.lineColor = '#1976D2';
        this.handleResize = this.handleResize.bind(this);

        if (this.canvas) {
            window.addEventListener('resize', this.handleResize);
            this.render();
        }
    }

    handleResize() {
        this.render();
    }

    reset() {
        this.history = [];
        this.render();
    }

    update(generation, chromosomeTotal) {
        if (typeof generation !== 'number') return;

        this.history.push({
            generation,
            chromosomeTotal: Math.max(0, Number(chromosomeTotal) || 0)
        });

        if (this.history.length > this.maxPoints) {
            this.history = this.history.slice(this.history.length - this.maxPoints);
        }

        this.render();
    }

    render() {
        if (!this.canvas || !this.context) return;

        const width = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || 0;
        const height = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || 0;

        if (!width || !height) return;

        const pixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.floor(width * pixelRatio);
        const targetHeight = Math.floor(height * pixelRatio);

        if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
        }

        const context = this.context;
        context.save();
        context.scale(pixelRatio, pixelRatio);
        context.clearRect(0, 0, width, height);

        this.drawBackground(context, width, height);

        if (this.history.length === 0) {
            this.drawEmptyState(context, width, height);
            context.restore();
            return;
        }

        const padding = { top: 22, right: 18, bottom: 30, left: 38 };
        const chartWidth = Math.max(1, width - padding.left - padding.right);
        const chartHeight = Math.max(1, height - padding.top - padding.bottom);
        const minGeneration = Math.max(1, this.history[0]?.generation || 1);
        const maxGeneration = Math.max(minGeneration, this.history[this.history.length - 1]?.generation || minGeneration);
        const maxChromosomesRaw = Math.max(10, ...this.history.map((entry) => entry.chromosomeTotal));
        const yHeadroom = Math.max(2, Math.ceil(maxChromosomesRaw * 0.08));
        const yMax = maxChromosomesRaw + yHeadroom;

        this.drawGrid(context, padding, chartWidth, chartHeight);
        this.drawAxes(context, padding, chartWidth, chartHeight, yMax, minGeneration, maxGeneration);
        this.drawChromosomeSeries(context, padding, chartWidth, chartHeight, yMax, minGeneration, maxGeneration);
        this.drawLegend(context, width, padding.top);

        context.restore();
    }

    drawBackground(context, width, height) {
        const gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#fbfdff');
        gradient.addColorStop(1, '#eef6fb');
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
    }

    drawEmptyState(context, width, height) {
        context.fillStyle = '#607d8b';
        context.font = '600 14px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Waiting for evolution to start...', width / 2, height / 2);
    }

    drawGrid(context, padding, chartWidth, chartHeight) {
        const gridLines = 4;
        context.strokeStyle = 'rgba(96, 125, 139, 0.16)';
        context.lineWidth = 1;

        for (let index = 0; index <= gridLines; index++) {
            const y = padding.top + (chartHeight * index) / gridLines;
            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(padding.left + chartWidth, y);
            context.stroke();
        }

        const verticalLines = Math.min(6, Math.max(2, this.history.length - 1));
        for (let index = 0; index <= verticalLines; index++) {
            const x = padding.left + (chartWidth * index) / verticalLines;
            context.beginPath();
            context.moveTo(x, padding.top);
            context.lineTo(x, padding.top + chartHeight);
            context.stroke();
        }
    }

    drawAxes(context, padding, chartWidth, chartHeight, yMax, minGeneration, maxGeneration) {
        context.fillStyle = '#455a64';
        context.font = '600 10px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        context.textAlign = 'right';
        context.textBaseline = 'middle';

        const yLabels = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];
        yLabels.forEach((value, index) => {
            const y = padding.top + (chartHeight * index) / (yLabels.length - 1);
            context.fillText(String(value), padding.left - 6, y);
        });

        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(String(minGeneration), padding.left, padding.top + chartHeight + 6);
        context.fillText(String(maxGeneration), padding.left + chartWidth, padding.top + chartHeight + 6);
        context.fillText('Generation', padding.left + chartWidth / 2, padding.top + chartHeight + 16);
    }

    drawChromosomeSeries(context, padding, chartWidth, chartHeight, yMax, minGeneration, maxGeneration) {
        if (this.history.length === 0) return;

        const range = Math.max(1, maxGeneration - minGeneration);
        const points = this.history.map((entry) => {
            const x = padding.left + (chartWidth * (entry.generation - minGeneration)) / range;
            const y = padding.top + chartHeight - (chartHeight * entry.chromosomeTotal) / yMax;
            return { x, y };
        });

        context.lineWidth = 2.5;
        context.strokeStyle = this.lineColor;
        context.fillStyle = this.lineColor;
        context.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }
        });
        context.stroke();

        points.forEach((point) => {
            context.beginPath();
            context.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
            context.fill();
        });
    }

    drawLegend(context, width, topOffset) {
        const legendX = width - 160;
        const legendY = topOffset - 4;

        context.font = '600 10px Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'middle';

        context.fillStyle = this.lineColor;
        context.fillRect(legendX, legendY, 10, 10);
        context.fillStyle = '#37474f';
        context.fillText('Total Chromosomes', legendX + 16, legendY + 5);
    }
}

export default PopulationChartView;
