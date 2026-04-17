# Knight's Tour

Interactive JavaScript application that explores the Knight's Tour problem with a genetic algorithm. The system searches for long valid knight paths on a chessboard while showing the evolution process in real time through a visual interface.

The project combines:

- a frontend that renders the board, controls, statistics, and playback
- a backend API that runs the genetic algorithm and stores score history in SQLite

<img width="1907" height="933" alt="image" src="https://github.com/user-attachments/assets/c39b3c1a-c7d1-4b12-a61e-01ad646d03d5" />

## Highlights

- Real-time visualization of the board and the current best route
- Adjustable genetic algorithm parameters from the UI
- Playback controls for the discovered knight path
- Score history persistence with SQLite
- Job-based backend processing with server-sent events for progress updates
- Plateau recovery strategy to avoid long stagnation periods
- Warnsdorff-inspired heuristic and inversion mutation support

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start both frontend and backend:

```bash
npm run dev
```

3. Open `http://localhost:3000`

If you prefer to run each side separately:

```bash
npm run start
npm run server
```

## Overview

The application is split into two layers:

- Frontend client: renders the board, controls, charts, and score history
- Backend API: executes generation jobs, streams progress, and persists results

This separation keeps the visualization responsive while the algorithm runs independently on the server side.

## How It Works

The genetic algorithm works with a population of chromosomes. Each chromosome represents a candidate sequence of board positions. Fitness is based on the longest valid knight-move path that can be extracted from that sequence.

At each generation, the system:

1. Creates or updates a population of randomized chromosomes
2. Evaluates and sorts individuals by fitness
3. Selects parents according to the chosen strategy
4. Applies crossover to generate offspring
5. Mutates part of the population to explore new paths
6. Optionally applies life-span rules
7. Detects stagnation and can trigger a partial restart
8. Publishes progress back to the UI until the run finishes or is stopped

### Search Strategies

- `elitist`: favors the best-ranked individuals
- `roulette`: introduces more randomness to preserve diversity

### Advanced Features

- Warnsdorff-inspired heuristic: biases the evaluation toward constrained squares, which often leads to stronger tours
- Inversion mutation: reverses chromosome segments to preserve useful sub-routes better than simple swaps
- Partial restart: preserves elite individuals and injects fresh chromosomes when progress stalls

Generation processing runs as an asynchronous backend job. The client starts a job, listens to SSE progress updates, and can request cancellation while the search is running.

## Interface

The main screen is organized into a few practical areas:

- Settings: generations, population size, selection, crossover, and mutation parameters
- Knight's path: board visualization, knight animation, and playback controls
- Results and statistics: best fitness, average fitness, generation counters, and visited squares
- Solution path: ordered route shown during playback

The playback controls allow pausing, stepping forward or backward, and changing animation speed.

## Main Parameters

- Generations: maximum number of iterations
- Chromosomes: population size
- Selection: percentage of individuals kept after ranking
- Crossover: fraction of the population used to generate offspring
- Mutation: percentage of individuals that mutate
- Mutation series: number of swap or inversion operations applied during mutation
- Life expectancy: lifespan of individuals when that rule is enabled
- Enable partial restart: toggles the anti-stagnation strategy
- Plateau generations: generations without improvement before restart
- Restart elite count: strongest individuals preserved during restart
- Restart population rate: percentage of non-elite individuals replaced during restart

## Anti-Plateau Strategy

When partial restart is enabled, the algorithm monitors the best fitness across generations:

- improvement resets the stagnation counter
- no improvement increases the counter
- reaching the configured plateau threshold triggers a partial restart
- the top elite individuals are preserved
- part of the remaining population is replaced with new random chromosomes

This helps the search escape local optima without discarding the best candidates already discovered.

## Environment Variables

- `PORT`: API server port. Default: `3333`
- `SCORE_DB_PATH`: custom SQLite database path. Default: `data/scores.db`
- `GENERATION_JOB_TTL_MS`: retention time for finished jobs in memory. Default: `300000`

## Generation Job API

The generation flow is job-based:

1. `POST /api/generate/jobs` starts a generation job
2. `GET /api/generate/jobs/:id` returns job status or final result
3. `GET /api/generate/jobs/:id/events` subscribes to progress updates through SSE
4. `DELETE /api/generate/jobs/:id` requests cancellation of a running job

Possible job statuses:

- `running`
- `completed`
- `stopped`
- `failed`

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
│   │   ├── view/
│   │   │   ├── BoardView.js
│   │   │   ├── StatsView.js
│   │   │   ├── PlaybackControlsView.js
│   │   │   └── PopulationChartView.js
│   │   └── model/
│   │       └── Score.js
│   │
│   └── server/
│       ├── server.ts
│       ├── controller/
│       │   └── GenerationController.ts
│       ├── domain/
│       │   └── KnightBoard.ts
│       ├── engine/
│       │   ├── GAEngine.ts
│       │   ├── PopulationManager.ts
│       │   ├── fitness/
│       │   │   └── FitnessEvaluator.ts
│       │   ├── selection/
│       │   │   ├── ElitistSelector.ts
│       │   │   └── RouletteSelector.ts
│       │   ├── crossover/
│       │   │   └── Crossover.ts
│       │   └── mutation/
│       │       └── Mutation.ts
│       ├── service/
│       │   ├── GenerationService.ts
│       │   └── Score.ts
│       └── model/
│           ├── Chromosome.ts
│           └── Score.ts
```

## Notes

- The roulette mode in this project uses simple random selection among eligible individuals
- The best result is not always a complete 64-square tour
- Stop requests are cooperative and complete at the next cancellation checkpoint
- The partial restart strategy is optional and configurable from the interface


