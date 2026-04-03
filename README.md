# Knight's Tour

JavaScript application that explores the Knight's Tour problem using a genetic algorithm. The goal is to find a path where the knight visits as many board squares as possible while respecting the chess knight's L-shaped movement.

The project includes a visual interface to follow the evolution, tune the search parameters, inspect the board in real time, and control the animation of the discovered solution.

## Overview

The project is split into two layers:

- `GenerationController`: thin orchestration layer responsible for coordinating the execution flow.
- `GenerationService`: contains the genetic algorithm implementation and all population operations.

This separation makes the code easier to maintain and keeps the controller focused on delegating work rather than containing algorithm details.

## How It Works

The algorithm works with a population of chromosomes, where each chromosome represents a sequence of board positions. Each sequence is evaluated based on the number of valid knight moves.

At each generation, the system:

1. Initializes the population with randomized chromosomes.
2. Sorts individuals by fitness.
3. Applies crossover between parents to generate new chromosomes.
4. Performs mutations to explore new combinations.
5. Applies life-span rules when that option is enabled.
6. Updates the interface statistics and continues until the generation limit is reached or a full path is found.

The search behavior changes depending on the selected processing mode:

- Elitist: prioritizes the best-ranked individuals.
- Roulette: performs a more random selection, which increases population diversity.

## Interface

The main screen is organized to make the search easy to follow:

- Settings: defines generations, chromosome count, selection, crossover, and mutation rates.
- Knight's path: shows the board, the animated knight, and playback controls.
- Results and statistics: shows current generation, fitness, average fitness, and visited squares.
- Solution path: lists the discovered route during the animation.

The playback controls allow you to adjust speed, pause, advance, and rewind the animation.

## Main Parameters

- Generations: maximum number of evolution iterations.
- Chromosomes: size of the initial population.
- Selection: percentage of the population kept after sorting.
- Crossover: fraction of individuals used to generate offspring.
- Mutation: percentage of individuals that undergo changes.
- Mutation series: number of swaps applied to each mutated individual.
- Life expectancy: how long individuals remain alive, when the rule is enabled.

## How to Run

1. Install the dependencies:

```bash
npm install
```

2. Start the local server:

```bash
npm run start
```

3. Open the address provided by the server in your browser.

## Project Structure

- `index.html`: main application interface.
- `style.css`: board, control panel, and statistics styles.
- `src/index.js`: orchestrates the interface, animation, and algorithm interaction.
- `src/controller/GenerationController.js`: thin controller that delegates the execution to the service.
- `src/service/GenerationService.js`: contains the full genetic algorithm implementation.
- `src/model/Cromossomo.js`: represents each individual in the population.

## Notes

- The roulette option used in the project is a simple random selection among available individuals.
- The best path found may not always be a complete 64-square solution, but the interface clearly shows how far the search progressed.
- The displayed solution path updates in real time during the animation.
   
