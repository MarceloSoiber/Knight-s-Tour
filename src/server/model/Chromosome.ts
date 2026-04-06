class Chromosome {
    private solution: number[];
    private score: number;
    private age: number;

    constructor(age: number = -2) {
        this.solution = [];
        this.score = 0;
        this.age = age;
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

    clone(): Chromosome {
        const clone = new Chromosome(this.age);
        clone.setSolution([...this.solution]);
        clone.setScore(this.score);
        return clone;
    }

    compareTo(other: Chromosome): number {
        return other.getScore() - this.getScore();
    }

    toString(): string {
        return `Chromosome {solution: [${this.solution.join(', ')}], score: ${this.score}, age: ${this.age}}`;
    }

    toJSON(): { solution: number[]; score: number; age: number } {
        return {
            solution: this.solution,
            score: this.score,
            age: this.age
        };
    }
}

export default Chromosome;
