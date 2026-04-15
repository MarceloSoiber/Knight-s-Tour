import type { ICrossover } from './ICrossover.ts';
import KnightBoard from '../../domain/KnightBoard.ts'; // Sua nova classe de domínio

class PathSplicingCrossover implements ICrossover {
    // 1. Declare a propriedade (o Node vai apagar apenas a tipagem ': KnightBoard')
    private board: KnightBoard;

    // 2. Remova o modificador 'private' do parâmetro
    constructor(board: KnightBoard) {
        // 3. Faça a atribuição manualmente
        this.board = board;
    }

    cross(parent1: number[], parent2: number[]): number[] {
        const size = parent1.length;
        const child = new Array<number>(size).fill(-1);
        const used = new Set<number>();

        // 1. Acha até onde o Pai 1 tem um caminho perfeito
        let p1ValidLength = this.getValidPrefixLength(parent1);
        
        // 2. Copia o caminho perfeito do Pai 1 para o filho
        for(let i = 0; i < p1ValidLength; i++) {
            child[i] = parent1[i];
            used.add(parent1[i]);
        }

        let currentIdx = p1ValidLength;
        let lastPos = child[currentIdx - 1];

        // 3. Tenta continuar usando os movimentos do Pai 2
        for (let i = 0; i < size; i++) {
            let candidate = parent2[i];
            
            // Se o gene do Pai 2 não foi usado E é um movimento válido a partir da última posição
            if (!used.has(candidate) && this.board.isValidMove(lastPos, candidate)) {
                child[currentIdx] = candidate;
                used.add(candidate);
                lastPos = candidate;
                currentIdx++;
            }
        }

        // 4. Se sobraram buracos (porque o Pai 2 não conseguiu conectar bem), 
        // preenche o resto com as casas que faltam (a mutação vai ter que consertar isso depois)
        for (let i = 1; i <= size; i++) {
            if (!used.has(i)) {
                child[currentIdx] = i;
                currentIdx++;
            }
        }

        return child;
    }

    private getValidPrefixLength(solution: number[]): number {
        let length = 1;
        for (let i = 1; i < solution.length; i++) {
            if (this.board.isValidMove(solution[i - 1], solution[i])) {
                length++;
            } else {
                break;
            }
        }
        return length;
    }
}
export default PathSplicingCrossover;