import GenerationService from './src/server/service/GenerationService.ts';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest(name, config, iterations = 1) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(70));

  let totalBest = 0;
  let totalAvg = 0;
  let maxPath = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const s = new GenerationService();
    const result = await s.run(config);
    
    totalBest += result.bestFitness;
    totalAvg += result.avgFitness;
    maxPath = Math.max(maxPath, result.solution.length);

    const score = Math.floor(result.bestFitness / 10);
    console.log(
      `[${iter + 1}] Gens: ${result.generationsExecuted.toString().padStart(2)} | ` +
      `Best: ${result.bestFitness.toFixed(1).padStart(5)} | ` +
      `Avg: ${result.avgFitness.toFixed(1).padStart(5)} | ` +
      `Score: ${score} | Path: ${result.solution.length}`
    );

    if (iter < iterations - 1) await delay(50);
  }

  console.log(`>>> Average Best: ${(totalBest / iterations).toFixed(1)} | Max Path: ${maxPath}`);
}

console.log('🔴 STAGNATION DIAGNOSIS: Fitness plateau at ~30 for 8x8 board\n');

// TEST 1: Default config (expected stagnation)
await runTest('TEST 1: DEFAULT CONFIG (expected stagnation)', {
  generations: 50,
  chromosomes: 30,
  processingOption: 'elitist',
}, 3);

// TEST 2: Higher generations
await runTest('TEST 2: EXTENDED GENERATIONS (50→100)', {
  generations: 100,
  chromosomes: 30,
  processingOption: 'elitist',
}, 2);

// TEST 3: Optimized config (adaptive mutation + restart)
await runTest('TEST 3: OPTIMIZED CONFIG (adaptive + restart)', {
  generations: 50,
  chromosomes: 30,
  processingOption: 'elitist',
  mutationRate: 10,
  enableAdaptiveMutationOnPlateau: true,
  enablePartialRestart: true,
  plateauGenerations: 10,
}, 3);

// TEST 4: Aggressive mutation only
await runTest('TEST 4: AGGRESSIVE MUTATION (30%)', {
  generations: 50,
  chromosomes: 30,
  processingOption: 'elitist',
  mutationRate: 30,
}, 2);

// TEST 5: Restart only
await runTest('TEST 5: PARTIAL RESTART ONLY', {
  generations: 50,
  chromosomes: 30,
  processingOption: 'elitist',
  mutationRate: 5,
  enablePartialRestart: true,
  plateauGenerations: 15,
}, 2);

console.log(`\n${'='.repeat(70)}`);
console.log('✅ DIAGNOSIS COMPLETE');
console.log('='.repeat(70));
