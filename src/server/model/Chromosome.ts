class Chromosome {
    private solucao: number[];
    private pontuacao: number;
    private idade: number;

    constructor(idade: number = -2) {
        this.solucao = [];
        this.pontuacao = 0;
        this.idade = idade;
    }

    getSolucao(): number[] {
        return this.solucao;
    }

    setSolucao(solucao: number[]): void {
        if (Array.isArray(solucao)) {
            this.solucao = solucao;
        } else {
            throw new Error('Solution must be an array');
        }
    }

    getPontuacao(): number {
        return this.pontuacao;
    }

    setPontuacao(pontuacao: number): void {
        if (typeof pontuacao === 'number') {
            this.pontuacao = pontuacao;
        } else {
            throw new Error('Score must be a number');
        }
    }

    getIdade(): number {
        return this.idade;
    }

    setIdade(idade: number): void {
        if (typeof idade === 'number') {
            this.idade = idade;
        } else {
            throw new Error('Age must be a number');
        }
    }

    envelhecer(): void {
        this.idade++;
    }

    clone(): Chromosome {
        const clone = new Chromosome(this.idade);
        clone.setSolucao([...this.solucao]);
        clone.setPontuacao(this.pontuacao);
        return clone;
    }

    compareTo(outro: Chromosome): number {
        return outro.getPontuacao() - this.getPontuacao();
    }

    toString(): string {
        return `Chromosome {solucao: [${this.solucao.join(', ')}], pontuacao: ${this.pontuacao}, idade: ${this.idade}}`;
    }

    toJSON(): { solucao: number[]; pontuacao: number; idade: number } {
        return {
            solucao: this.solucao,
            pontuacao: this.pontuacao,
            idade: this.idade
        };
    }
}

export default Chromosome;
