class Chromosome {
    private solution: number[];
    private score: number;
    private age: number;
    private fitness: number;

    constructor(age: number = -2) {
        this.solution = [];
        this.score = 0;
        this.age = age;
        this.fitness = 0;
    }

    getSolution(): number[] {
        return this.solution;
    }

    setSolution(solution: number[]): void {
        if (Array.isArray(solution)) {
            this.solution = solution;
        } else {
            throw new Error('Solution must be an array');
        }
    }

    getScore(): number {
        return this.score;
    }

    setScore(score: number): void {
        if (typeof score === 'number') {
            this.score = score;
        } else {
            throw new Error('Score must be a number');
        }
    }

    getAge(): number {
        return this.age;
    }

    setAge(age: number): void {
        if (typeof age === 'number') {
            this.age = age;
        } else {
            throw new Error('Age must be a number');
        }
    }

    ageUp(): void {
        this.age++;
    }

    getFitness(): number {
        return this.fitness;
    }

    setFitness(fitness: number): void {
        if (typeof fitness === 'number') {
            this.fitness = fitness;
        } else {
            throw new Error('Fitness must be a number');
        }
    }

    clone(): Chromosome {
        const clone = new Chromosome(this.age);
        clone.setSolution([...this.solution]);
        clone.setScore(this.score);
        clone.setFitness(this.fitness);
        return clone;
    }

    compareTo(other: Chromosome): number {
        return other.getFitness() - this.getFitness();
    }

    toString(): string {
        return `Chromosome {solution: [${this.solution.join(', ')}], score: ${this.score}, fitness: ${this.fitness}, age: ${this.age}}`;
    }

    toJSON(): { solution: number[]; score: number; fitness: number; age: number } {
        return {
            solution: this.solution,
            score: this.score,
            fitness: this.fitness,
            age: this.age
        };
    }
}

export default Chromosome;
