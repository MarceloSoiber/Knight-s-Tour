# Knight's Tour

JavaScript application that explores the Knight's Tour problem using a genetic algorithm. The goal is to find a path where the knight visits as many board squares as possible while respecting the chess knight's L-shaped movement.

The project includes a visual interface to follow the evolution, tune the search parameters, inspect the board in real time, and control the animation of the discovered solution.

<img width="1907" height="933" alt="image" src="https://github.com/user-attachments/assets/c39b3c1a-c7d1-4b12-a61e-01ad646d03d5" />

## Overview

The project is split into two layers:

- Frontend client: renders the board, controls, charts, and score history UI.
- Backend API: runs the genetic algorithm jobs and persists score history in SQLite.

This separation keeps UI concerns isolated from processing and data persistence.

## How It Works

The algorithm works with a population of chromosomes, where each chromosome represents a sequence of board positions. Each sequence is evaluated by the length of the longest valid knight-move path found in the chromosome.

At each generation, the system:

1. Initializes the population with randomized chromosomes.
2. Sorts individuals by fitness.
3. Applies crossover between parents to generate new chromosomes.
4. Performs mutations to explore new combinations, including inversion mutations that preserve sub-routes.
5. Applies life-span rules when that option is enabled.
6. Detects stagnation and can trigger a partial restart with elite preservation.
7. Updates the interface statistics and continues until the generation limit is reached or a full path is found.

**Advanced Features:**

- **Warnsdorff's Rule Heuristic**: Guides the search toward more challenging routes by penalizing squares with many available options. Uses a `1/(options+1)` model to prefer constrained positions that typically lead to longer valid paths.
- **Inversion Mutation**: Advanced mutation operator that inverts chromosome segments between two points instead of simple swaps. Uses a 50% chance of inversion vs 50% swap during mutation, preserving valuable sub-routes better than pure transposition. Guided mutation focuses on conflictIndex ±3 with 75% probability.

Generation processing runs as an asynchronous backend job. The client creates a job, subscribes to server-sent events for progress updates, and can request cancellation while processing is running.

The search behavior changes depending on the selected processing mode:

- Elitist: prioritizes the best-ranked individuals.
- Roulette: performs a more random selection, which increases population diversity.

The plateau recovery strategy preserves the strongest individuals and injects new random chromosomes when the search stops improving for too long.

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
- Enable partial restart: enables or disables the anti-plateau recovery strategy.
- Plateau generations: number of consecutive generations without improvement before recovery is triggered.
- Restart elite count: number of top individuals preserved during recovery.
- Restart population rate: percentage of the non-elite population replaced by random newcomers during recovery.

## Anti-Plateau Strategy

When partial restart is enabled, the algorithm monitors the best fitness across generations.

- If best fitness improves, the stagnation counter is reset.
- If best fitness does not improve, the stagnation counter increases.
- When the counter reaches Plateau generations, a partial restart is executed.
- The top Restart elite count individuals are preserved.
- A fraction of the remaining population is replaced according to Restart population rate.
- New random individuals are evaluated and merged back into the population.

This strategy helps escape local optima while preserving the strongest candidates already found.

## How to Run

1. Install the dependencies:

```bash
npm install
```

2. Start the frontend (BrowserSync):

```bash
npm run start
```

3. In another terminal, start the API server:

```bash
npm run server
```

4. Open the frontend URL shown by BrowserSync (default: http://localhost:3000).

## Environment Variables

- `PORT`: API server port (default: `3333`).
- `SCORE_DB_PATH`: custom SQLite file path (default: `data/scores.db` under project root).
- `GENERATION_JOB_TTL_MS`: retention time for finished generation jobs in memory (default: `300000`).

## Generation Job API

The generation flow is job-based:

1. `POST /api/generate/jobs`: starts a generation job.
2. `GET /api/generate/jobs/:id`: fetches job status/result.
3. `GET /api/generate/jobs/:id/events`: subscribes to progress events (SSE).
4. `DELETE /api/generate/jobs/:id`: requests stop for a running job.

Possible job statuses: `running`, `completed`, `stopped`, `failed`.

## Example Generation Job Payload

```json
{
	"generations": 1000,
	"chromosomes": 15000,
	"selectionRate": 50,
	"crossoverRate": 100,
	"mutationRate": 10,
	"seriesPerMutation": 12,
	"lifeExpectancy": 15,
	"activateLifeExpectancy": false,
	"processingOption": "elitist",
	"enablePartialRestart": true,
	"plateauGenerations": 20,
	"restartEliteCount": 2,
	"restartPopulationRate": 70
}
```

## Project Structure

```text
project-root/
├── public/
│   ├── index.html          # Main application interface
│   └── style.css           # Board, controls, and stats styles
│
├── src/
│   ├── client/
│   │   ├── main.js         # UI orchestration, animation, API integration
│   │   │
│   │   ├── view/
│   │   │   ├── BoardView.js              # Board rendering + knight position
│   │   │   ├── StatsView.js              # Stats, progress, history table
│   │   │   ├── PlaybackControlsView.js   # Controls and action bindings
│   │   │   └── PopulationChartView.js    # Population chart rendering
│   │   │
│   │   └── model/
│   │       └── Score.js     # Client-side score (pre-persistence)
│   │
│   └── server/
│       ├── server.ts        # HTTP API entrypoint
│       │
│       ├── controller/
│       │   └── GenerationController.ts   # Request orchestration and job management
│       │
│       ├── domain/
│       │   └── KnightBoard.ts            # Knight movement validation and board logic
│       │
│       ├── engine/
│       │   ├── GAEngine.ts               # Main genetic algorithm orchestrator
│       │   ├── PopulationManager.ts      # Population initialization and management
│       │   │
│       │   ├── fitness/
│       │   │   └── FitnessEvaluator.ts   # Warnsdorff heuristic and path evaluation
│       │   │
│       │   ├── selection/
│       │   │   ├── ElitistSelector.ts    # Elite selection strategy
│       │   │   └── RouletteSelector.ts   # Random roulette selection
│       │   │
│       │   ├── crossover/
│       │   │   └── Crossover.ts          # Parent recombination operators
│       │   │
│       │   └── mutation/
│       │       └── Mutation.ts           # Swap and inversion mutations
│       │
│       ├── service/
│       │   ├── GenerationService.ts      # Job orchestration and iteration control
│       │   └── Score.ts                  # SQLite persistence layer
│       │
│       └── model/
│           ├── Chromosome.ts             # Domain model and genetic representation
│           └── Score.ts                  # Backend score entity
```
## Notes

- The roulette option used in the project is a simple random selection among available individuals.
- The best path found may not always be a complete 64-square solution, but the interface clearly shows how far the search progressed.
- The displayed solution path updates in real time during the animation.
- Stop requests are cooperative: the job receives a cancellation flag and ends as soon as the current processing checkpoints are reached.
- The partial restart strategy is disabled by default and can be tuned from the settings panel.

