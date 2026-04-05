import Chromosome from '../model/Chromosome.ts';

export type GenerationCallbacks = {
	shouldStop?: () => boolean;
	onGeneration?: (payload: {
		generation: number;
		bestFitness: number;
		avgFitness: number;
		chromosomeTotal: number;
		totalGenerations: number;
	}) => void;
};

export type GenerationConfig = {
	generations: number;
	chromosomes: number;
	selectionRate: number;
	crossoverRate: number;
	mutationRate: number;
	seriesPerMutation: number;
	lifeExpectancy: number;
	activateLifeExpectancy: boolean;
	processingOption: 'elitist' | 'rotation';
};

export type GenerationResult = {
	generationsExecuted: number;
	bestFitness: number;
	avgFitness: number;
	solution: Array<{ row: number; col: number }>;
	stopped: boolean;
};

class GenerationService {
	private boardSize: number;
	private totalCasas: number;
	private populacao: Chromosome[];

	constructor(boardSize: number = 8) {
		this.boardSize = boardSize;
		this.totalCasas = boardSize * boardSize;
		this.populacao = [];
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		const cfg = this.normalizeConfig(config);
		this.inicializarPopulacao(cfg.chromosomes, cfg.lifeExpectancy);

		let best = this.populacao[0];
		let generation = 0;
		let stopped = false;

		while (generation < cfg.generations) {
			if (callbacks.shouldStop && callbacks.shouldStop()) {
				stopped = true;
				break;
			}

			if (cfg.processingOption === 'elitist') {
				this.gerarGeracaoElitista(cfg);
			} else {
				this.gerarGeracaoRoleta(cfg);
			}
			generation += 1;
			this.ordenarPopulacao();
			best = this.populacao[0];

			if (best.getPontuacao() === this.totalCasas) {
				break;
			}

			if (callbacks.onGeneration) {
				callbacks.onGeneration({
					generation,
					bestFitness: best.getPontuacao(),
					avgFitness: this.calcularMediaFitness(),
					chromosomeTotal: this.populacao.length,
					totalGenerations: cfg.generations
				});
			}

			if (callbacks.shouldStop && callbacks.shouldStop()) {
				stopped = true;
				break;
			}

			if (best.getPontuacao() === this.totalCasas) {
				break;
			}

			if (generation % 10 === 0) {
				await this.sleep(0);
			}
		}

		this.ordenarPopulacao();
		best = this.populacao[0];
		const validPath = this.extrairPercursoValido(best.getSolucao());

		return {
			generationsExecuted: generation,
			bestFitness: best.getPontuacao(),
			avgFitness: this.calcularMediaFitness(),
			solution: validPath,
			stopped
		};
	}

	private normalizeConfig(config: Partial<GenerationConfig>): GenerationConfig {
		return {
			generations: Number(config.generations) || 1,
			chromosomes: Number(config.chromosomes) || 100,
			selectionRate: Number(config.selectionRate) || 50,
			crossoverRate: Number(config.crossoverRate) || 100,
			mutationRate: Number(config.mutationRate) || 5,
			seriesPerMutation: Number(config.seriesPerMutation) || 5,
			lifeExpectancy: Number(config.lifeExpectancy) || 15,
			activateLifeExpectancy: Boolean(config.activateLifeExpectancy),
			processingOption: config.processingOption === 'elitist' ? 'elitist' : 'rotation'
		};
	}

	private inicializarPopulacao(quantidade: number, lifeExpectancy: number): void {
		this.populacao = [];

		for (let i = 0; i < quantidade; i++) {
			const genes = this.criarGenesAleatorios();
			const cromossomo = new Chromosome(-2);
			cromossomo.setSolucao(genes);
			cromossomo.setPontuacao(this.fitness(cromossomo));
			this.populacao.push(cromossomo);
		}

		this.aplicarVida(lifeExpectancy, true);
		this.ordenarPopulacao();
	}

	private criarGenesAleatorios(): number[] {
		const genes = Array.from({ length: this.totalCasas }, (_, i) => i + 1);

		for (let i = genes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[genes[i], genes[j]] = [genes[j], genes[i]];
		}

		return genes;
	}

	private gerarGeracaoElitista(cfg: GenerationConfig): void {
		this.envelhecer(cfg.activateLifeExpectancy);

		const qtdIndividuoCross = Math.max(2, Math.floor((cfg.crossoverRate * this.populacao.length) / 100));
		const limite = qtdIndividuoCross % 2 === 0 ? qtdIndividuoCross : qtdIndividuoCross - 1;

		for (let i = 0; i < limite - 1 && i + 1 < this.populacao.length; i += 2) {
			const pai = this.populacao[i];
			const mae = this.populacao[i + 1];
			const [filho1, filho2] = this.gerarFilhos(pai, mae);
			this.populacao.push(filho1, filho2);
		}

		this.selecaoIndividuo(cfg.selectionRate);
		this.mutacao(cfg.mutationRate, cfg.seriesPerMutation);
		this.aplicarVida(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
	}

	private gerarGeracaoRoleta(cfg: GenerationConfig): void {
		this.envelhecer(cfg.activateLifeExpectancy);

		const qtdIndividuoCross = Math.max(2, Math.floor((cfg.crossoverRate * this.populacao.length) / 100));
		const limite = qtdIndividuoCross % 2 === 0 ? qtdIndividuoCross : qtdIndividuoCross - 1;

		for (let i = 0; i < limite; i += 2) {
			const paiIndex = Math.floor(Math.random() * this.populacao.length);
			let maeIndex = Math.floor(Math.random() * this.populacao.length);
			if (maeIndex === paiIndex) {
				maeIndex = (maeIndex + 1) % this.populacao.length;
			}

			const pai = this.populacao[paiIndex];
			const mae = this.populacao[maeIndex];
			const [filho1, filho2] = this.gerarFilhos(pai, mae);
			this.populacao.push(filho1, filho2);
		}

		this.mutacao(cfg.mutationRate, cfg.seriesPerMutation);
		this.selecaoIndividuo(cfg.selectionRate);
		this.aplicarVida(cfg.lifeExpectancy, cfg.activateLifeExpectancy);
	}

	private gerarFilhos(pai: Chromosome, mae: Chromosome): [Chromosome, Chromosome] {
		const pontoCorte = Math.floor(Math.random() * (this.totalCasas - 2)) + 1;
		const genesPai = pai.getSolucao();
		const genesMae = mae.getSolucao();

		const genesFilho1 = this.cruzarGenes(genesPai, genesMae, pontoCorte);
		const genesFilho2 = this.cruzarGenes(genesMae, genesPai, pontoCorte);

		const filho1 = new Chromosome();
		filho1.setSolucao(genesFilho1);
		filho1.setPontuacao(this.fitness(filho1));

		const filho2 = new Chromosome();
		filho2.setSolucao(genesFilho2);
		filho2.setPontuacao(this.fitness(filho2));

		return [filho1, filho2];
	}

	private cruzarGenes(primeiro: number[], segundo: number[], pontoCorte: number): number[] {
		const inicio = primeiro.slice(0, pontoCorte);
		const usados = new Set(inicio);
		const resto = segundo.filter((gene) => !usados.has(gene));
		return [...inicio, ...resto];
	}

	private selecaoIndividuo(selectionRate: number): void {
		this.ordenarPopulacao();
		const qtd = Math.max(2, Math.floor((this.populacao.length * selectionRate) / 100));
		this.populacao = this.populacao.slice(0, Math.min(qtd, this.populacao.length));
	}

	private mutacao(mutationRate: number, alteracoesPorIndividuo: number): void {
		const qtdMutacoes = Math.floor((this.populacao.length * mutationRate) / 100);

		for (let i = 0; i < qtdMutacoes; i++) {
			const indice = Math.floor(Math.random() * this.populacao.length);
			const cromossomo = this.populacao[indice];
			const genes = [...cromossomo.getSolucao()];

			for (let j = 0; j < alteracoesPorIndividuo; j++) {
				const a = Math.floor(Math.random() * this.totalCasas);
				const b = Math.floor(Math.random() * this.totalCasas);
				[genes[a], genes[b]] = [genes[b], genes[a]];
			}

			cromossomo.setSolucao(genes);
			cromossomo.setPontuacao(this.fitness(cromossomo));
		}

		this.ordenarPopulacao();
	}

	private envelhecer(ativado: boolean): void {
		if (!ativado) return;

		for (const cromossomo of this.populacao) {
			cromossomo.setIdade(cromossomo.getIdade() - 1);
		}
	}

	private aplicarVida(lifeExpectancy: number, ativado: boolean): void {
		if (!ativado) return;

		const novaPopulacao = [];
		for (const cromossomo of this.populacao) {
			if (cromossomo.getIdade() === -2) {
				cromossomo.setIdade(lifeExpectancy);
				novaPopulacao.push(cromossomo);
			} else if (cromossomo.getIdade() > 0) {
				novaPopulacao.push(cromossomo);
			}else{
				cromossomo.setPontuacao(0);
				novaPopulacao.push(cromossomo);
			}
		}

		this.populacao = novaPopulacao;

		while (this.populacao.length < 2) {
			const genes = this.criarGenesAleatorios();
			const c = new Chromosome(lifeExpectancy);
			c.setSolucao(genes);
			c.setPontuacao(this.fitness(c));
			this.populacao.push(c);
		}
	}

	private fitness(cromossomo: Chromosome): number {
		const genes = cromossomo.getSolucao();
		if (!genes || genes.length === 0) return 0;

		let total = 1;
		for (let i = 1; i < genes.length; i++) {
			if (!this.movimentoCavaloValido(genes[i - 1], genes[i])) {
				break;
			}
			total += 1;
		}

		return total;
	}

	private movimentoCavaloValido(origem: number, destino: number): boolean {
		const o = this.converterPosicaoParaCoordenada(origem);
		const d = this.converterPosicaoParaCoordenada(destino);

		const dr = Math.abs(o.row - d.row);
		const dc = Math.abs(o.col - d.col);

		return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
	}

	private converterPosicaoParaCoordenada(posicao: number): { row: number; col: number } {
		const index = posicao - 1;
		return {
			row: Math.floor(index / this.boardSize),
			col: index % this.boardSize
		};
	}

	private converterSolucaoParaCoordenadas(solucao: number[]): Array<{ row: number; col: number }> {
		return solucao.map((posicao) => this.converterPosicaoParaCoordenada(posicao));
	}

	private extrairPercursoValido(solucao: number[]): Array<{ row: number; col: number }> {
		if (!solucao || solucao.length === 0) return [];

		const percursoValido = [this.converterPosicaoParaCoordenada(solucao[0])];

		for (let i = 1; i < solucao.length; i++) {
			const origem = solucao[i - 1];
			const destino = solucao[i];
			if (!this.movimentoCavaloValido(origem, destino)) {
				break;
			}

			percursoValido.push(this.converterPosicaoParaCoordenada(destino));
		}

		return percursoValido;
	}

	private ordenarPopulacao(): void {
		this.populacao.sort((a, b) => b.getPontuacao() - a.getPontuacao());
	}

	private calcularMediaFitness(): number {
		if (this.populacao.length === 0) return 0;
		const total = this.populacao.reduce((acc, item) => acc + item.getPontuacao(), 0);
		return total / this.populacao.length;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GenerationService;
