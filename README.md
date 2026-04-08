# Knight's Tour

JavaScript application that explores the Knight's Tour problem using a genetic algorithm. The goal is to find a path where the knight visits as many board squares as possible while respecting the chess knight's L-shaped movement.

The project includes a visual interface to follow the evolution, tune the search parameters, inspect the board in real time, and control the animation of the discovered solution.

<img width="1069" height="902" alt="image" src="https://github.com/user-attachments/assets/2e814821-2483-4154-8768-548a412faf41" />


## Overview

The project is split into two layers:

- Frontend client: renders the board, controls, charts, and score history UI.
- Backend API: runs the genetic algorithm jobs and persists score history in SQLite.

This separation keeps UI concerns isolated from processing and data persistence.

## How It Works

The algorithm works with a population of chromosomes, where each chromosome represents a sequence of board positions. Each sequence is evaluated based on the number of valid knight moves.

At each generation, the system:

1. Initializes the population with randomized chromosomes.
2. Sorts individuals by fitness.
3. Applies crossover between parents to generate new chromosomes.
4. Performs mutations to explore new combinations.
5. Applies life-span rules when that option is enabled.
6. Updates the interface statistics and continues until the generation limit is reached or a full path is found.

Generation processing runs as an asynchronous backend job. The client creates a job, subscribes to server-sent events for progress updates, and can request cancellation while processing is running.

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
│       │   └── GenerationController.ts   # Request orchestration
│       │
│       ├── service/
│       │   ├── GenerationService.ts      # Genetic algorithm logic
│       │   └── Score.ts                  # SQLite persistence layer
│       │
│       └── model/
│           ├── Chromosome.ts             # Domain model
│           └── Score.ts                  # Backend score entity
```
## Notes

- The roulette option used in the project is a simple random selection among available individuals.
- The best path found may not always be a complete 64-square solution, but the interface clearly shows how far the search progressed.
- The displayed solution path updates in real time during the animation.
- Stop requests are cooperative: the job receives a cancellation flag and ends as soon as the current processing checkpoints are reached.
   
