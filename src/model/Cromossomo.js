/**
 * Classe Cromossomo
 * Representa um cromossomo no algoritmo genético do Knight's Tour
 */
class Cromossomo {
    /**
     * Construtor da classe Cromossomo
     * @param {number} idade - Idade do cromossomo (padrão: -2)
     */
    constructor(idade = -2) {
        this.solucao = [];
        this.pontuacao = 0;
        this.idade = idade;
    }

    /**
     * Obtém a solução (Array de inteiros)
     * @returns {Array<number>} Array contendo a sequência de movimentos
     */
    getSolucao() {
        return this.solucao;
    }

    /**
     * Define a solução
     * @param {Array<number>} solucao - Array de inteiros representando o caminho
     */
    setSolucao(solucao) {
        if (Array.isArray(solucao)) {
            this.solucao = solucao;
        } else {
            throw new Error('Solução deve ser um array');
        }
    }

    /**
     * Obtém a pontuação (fitness) do cromossomo
     * @returns {number} Valor da pontuação
     */
    getPontuacao() {
        return this.pontuacao;
    }

    /**
     * Define a pontuação do cromossomo
     * @param {number} pontuacao - Valor da nova pontuação
     */
    setPontuacao(pontuacao) {
        if (typeof pontuacao === 'number') {
            this.pontuacao = pontuacao;
        } else {
            throw new Error('Pontuação deve ser um número');
        }
    }

    /**
     * Obtém a idade do cromossomo
     * @returns {number} Idade do cromossomo
     */
    getIdade() {
        return this.idade;
    }

    /**
     * Define a idade do cromossomo
     * @param {number} idade - Nova idade
     */
    setIdade(idade) {
        if (typeof idade === 'number') {
            this.idade = idade;
        } else {
            throw new Error('Idade deve ser um número');
        }
    }

    /**
     * Incrementa a idade do cromossomo em 1
     */
    envelhecer() {
        this.idade++;
    }

    /**
     * Cria uma cópia profunda do cromossomo
     * @returns {Cromossomo} Nova instância com os mesmos valores
     */
    clone() {
        const clone = new Cromossomo(this.idade);
        clone.setSolucao([...this.solucao]);
        clone.setPontuacao(this.pontuacao);
        return clone;
    }

    /**
     * Compara dois cromossomos pela pontuação
     * @param {Cromossomo} outro - Outro cromossomo para comparação
     * @returns {number} Diferença de pontuação
     */
    compareTo(outro) {
        return outro.getPontuacao() - this.getPontuacao();
    }

    /**
     * Retorna uma representação em string do cromossomo
     * @returns {string} Representação formatada
     */
    toString() {
        return `Cromossomo {solucao: [${this.solucao.join(', ')}], pontuacao: ${this.pontuacao}, idade: ${this.idade}}`;
    }

    /**
     * Retorna um objeto JSON do cromossomo
     * @returns {Object} Objeto com as propriedades
     */
    toJSON() {
        return {
            solucao: this.solucao,
            pontuacao: this.pontuacao,
            idade: this.idade
        };
    }
}

export default Cromossomo;
