import pkg from 'knex';
const { knex } = pkg;
import type { Knex } from 'knex';
import ScoreModel from '../model/Score.ts';

export type ScoreInput = {
  fitness?: number;
  averageFitness?: number;
  generation?: number;
  solution?: unknown[];
  generations?: number;
  chromosomes?: number;
  selectionRate?: number;
  crossoverRate?: number;
  mutationRate?: number;
  enableAdaptiveMutationOnPlateau?: boolean;
  plateauMutationRate?: number;
  seriesPerMutation?: number;
  lifeExpectancy?: number;
  activateLifeExpectancy?: boolean;
  processingOption?: string;
  enablePartialRestart?: boolean;
  plateauGenerations?: number;
  restartEliteCount?: number;
  restartPopulationRate?: number;
  modelBestFitness?: number;
  modelAvgFitness?: number;
  top10AvgScore?: number;
  medianScore?: number;
  createdAt?: string;
};

export type StoredScore = {
  id: number;
  fitness: number;
  averageFitness: number;
  generation: number;
  createdAt: string;
  solution: unknown[];
  generations: number;
  chromosomes: number;
  selectionRate: number;
  crossoverRate: number;
  mutationRate: number;
  enableAdaptiveMutationOnPlateau: number;
  plateauMutationRate: number;
  seriesPerMutation: number;
  lifeExpectancy: number;
  activateLifeExpectancy: number;
  processingOption: string;
  enablePartialRestart: number;
  plateauGenerations: number;
  restartEliteCount: number;
  restartPopulationRate: number;
  modelBestFitness: number;
  modelAvgFitness: number;
  top10AvgScore: number;
  medianScore: number;
};

type ScoreClass = new (configForm?: Record<string, unknown>) => {
  setId?: (id: number | null) => void;
  setFitness?: (fitness: number) => void;
  setAverageFitness?: (averageFitness: number) => void;
  setGeneration?: (generation: number) => void;
  setCreatedAt?: (createdAt: string | Date) => void;
  setSolution?: (solution: unknown[]) => void;
  setGenerations?: (generations: number) => void;
  setChromosomes?: (chromosomes: number) => void;
  setSelectionRate?: (selectionRate: number) => void;
  setCrossoverRate?: (crossoverRate: number) => void;
  setMutationRate?: (mutationRate: number) => void;
  setEnableAdaptiveMutationOnPlateau?: (enableAdaptiveMutationOnPlateau: boolean) => void;
  setPlateauMutationRate?: (plateauMutationRate: number) => void;
  setSeriesPerMutation?: (seriesPerMutation: number) => void;
  setLifeExpectancy?: (lifeExpectancy: number) => void;
  setActivateLifeExpectancy?: (activateLifeExpectancy: boolean) => void;
  setProcessingOption?: (processingOption: string) => void;
  setEnablePartialRestart?: (enablePartialRestart: boolean) => void;
  setPlateauGenerations?: (plateauGenerations: number) => void;
  setRestartEliteCount?: (restartEliteCount: number) => void;
  setRestartPopulationRate?: (restartPopulationRate: number) => void;
  setModelBestFitness?: (modelBestFitness: number) => void;
  setModelAvgFitness?: (modelAvgFitness: number) => void;
  setTop10AvgScore?: (top10AvgScore: number) => void;
  setMedianScore?: (medianScore: number) => void;
  toJSON?: () => unknown;
};

function nowAtMinusThreeIso(): string {
  const offsetMinutes = -3 * 60;
  const shifted = new Date(Date.now() + offsetMinutes * 60 * 1000);

  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
  const seconds = String(shifted.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(shifted.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}-03:00`;
}

type StoredScoreDbRow = {
  id: number;
  fitness: number;
  averageFitness: number;
  generation: number;
  createdAt: string;
  solution: string;
  generations: number;
  chromosomes: number;
  selectionRate: number;
  crossoverRate: number;
  mutationRate: number;
  enableAdaptiveMutationOnPlateau: number;
  plateauMutationRate: number;
  seriesPerMutation: number;
  lifeExpectancy: number;
  activateLifeExpectancy: number;
  processingOption: string;
  enablePartialRestart: number;
  plateauGenerations: number;
  restartEliteCount: number;
  restartPopulationRate: number;
  modelBestFitness: number;
  modelAvgFitness: number;
  top10AvgScore: number;
  medianScore: number;
};

function parseStoredSolution(raw: string | null | undefined): unknown[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class ScoreService {
  private db: Knex;
  private ScoreClass: ScoreClass;
  private isSetup = false;


  constructor(dbPath: string, scoreClass: ScoreClass = ScoreModel) {
    this.ScoreClass = scoreClass;
    this.db = knex({
      client: 'better-sqlite3',
      connection: {
        filename: dbPath.replace('file:', ''),
      },
      useNullAsDefault: true,
    });
  }

  private hydrateScore(row: StoredScoreDbRow) {
    const score = new this.ScoreClass();

    score.setId?.(row.id);
    score.setFitness?.(row.fitness);
    score.setAverageFitness?.(row.averageFitness);
    score.setGeneration?.(row.generation);
    score.setCreatedAt?.(row.createdAt);
    score.setSolution?.(parseStoredSolution(row.solution));
    score.setGenerations?.(row.generations);
    score.setChromosomes?.(row.chromosomes);
    score.setSelectionRate?.(row.selectionRate);
    score.setCrossoverRate?.(row.crossoverRate);
    score.setMutationRate?.(row.mutationRate);
    score.setEnableAdaptiveMutationOnPlateau?.(Boolean(row.enableAdaptiveMutationOnPlateau));
    score.setPlateauMutationRate?.(row.plateauMutationRate);
    score.setSeriesPerMutation?.(row.seriesPerMutation);
    score.setLifeExpectancy?.(row.lifeExpectancy);
    score.setActivateLifeExpectancy?.(Boolean(row.activateLifeExpectancy));
    score.setProcessingOption?.(row.processingOption);
    score.setEnablePartialRestart?.(Boolean(row.enablePartialRestart));
    score.setPlateauGenerations?.(row.plateauGenerations);
    score.setRestartEliteCount?.(row.restartEliteCount);
    score.setRestartPopulationRate?.(row.restartPopulationRate);
    score.setModelBestFitness?.(row.modelBestFitness);
    score.setModelAvgFitness?.(row.modelAvgFitness);
    score.setTop10AvgScore?.(row.top10AvgScore);
    score.setMedianScore?.(row.medianScore);

    return score;
  }

  private async renameColumnIfNeeded(tableName: string, oldName: string, newName: string): Promise<void> {
    const hasOld = await this.db.schema.hasColumn(tableName, oldName);
    const hasNew = await this.db.schema.hasColumn(tableName, newName);

    if (hasOld && !hasNew) {
      await this.db.schema.alterTable(tableName, (table) => {
        table.renameColumn(oldName, newName);
      });
    }
  }

  private async migrateLegacyColumns(): Promise<void> {
    await this.renameColumnIfNeeded('scores', 'fitnessMedia', 'averageFitness');
    await this.renameColumnIfNeeded('scores', 'geracao', 'generation');
    await this.renameColumnIfNeeded('scores', 'criadoEm', 'createdAt');
    await this.renameColumnIfNeeded('scores', 'solucao', 'solution');
  }

  private async addColumnIfMissing(
    tableName: string,
    columnName: string,
    addColumn: (table: Knex.CreateTableBuilder) => void
  ): Promise<void> {
    const hasColumn = await this.db.schema.hasColumn(tableName, columnName);
    if (hasColumn) return;

    await this.db.schema.alterTable(tableName, (table) => {
      addColumn(table);
    });
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;

    const exists = await this.db.schema.hasTable('scores');
    if (!exists) {
      await this.db.schema.createTable('scores', (table) => {
        table.increments('id').primary();
        table.float('fitness').notNullable().defaultTo(0);
        table.float('averageFitness').notNullable().defaultTo(0);
        table.integer('generation').notNullable().defaultTo(0);
        table.text('createdAt').notNullable();
        table.text('solution').notNullable().defaultTo('[]');

        table.integer('generations').notNullable().defaultTo(0);
        table.integer('chromosomes').notNullable().defaultTo(0);
        table.float('selectionRate').notNullable().defaultTo(0);
        table.float('crossoverRate').notNullable().defaultTo(0);
        table.float('mutationRate').notNullable().defaultTo(0);
        table.boolean('enableAdaptiveMutationOnPlateau').notNullable().defaultTo(false);
        table.float('plateauMutationRate').notNullable().defaultTo(0);
        table.integer('seriesPerMutation').notNullable().defaultTo(0);
        table.integer('lifeExpectancy').notNullable().defaultTo(0);
        table.boolean('activateLifeExpectancy').notNullable().defaultTo(false);
        table.string('processingOption').notNullable().defaultTo('rotation');
        table.boolean('enablePartialRestart').notNullable().defaultTo(false);
        table.integer('plateauGenerations').notNullable().defaultTo(0);
        table.integer('restartEliteCount').notNullable().defaultTo(0);
        table.float('restartPopulationRate').notNullable().defaultTo(0);
        table.float('modelBestFitness').notNullable().defaultTo(0);
        table.float('modelAvgFitness').notNullable().defaultTo(0);
        table.float('top10AvgScore').notNullable().defaultTo(0);
        table.float('medianScore').notNullable().defaultTo(0);
      });
    } else {
      await this.migrateLegacyColumns();

      const hasSolution = await this.db.schema.hasColumn('scores', 'solution');
      if (!hasSolution) {
        await this.db.schema.alterTable('scores', (table) => {
          table.text('solution').notNullable().defaultTo('[]');
        });
      }

      await this.addColumnIfMissing('scores', 'enableAdaptiveMutationOnPlateau', (table) => {
        table.boolean('enableAdaptiveMutationOnPlateau').notNullable().defaultTo(false);
      });
      await this.addColumnIfMissing('scores', 'plateauMutationRate', (table) => {
        table.float('plateauMutationRate').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'enablePartialRestart', (table) => {
        table.boolean('enablePartialRestart').notNullable().defaultTo(false);
      });
      await this.addColumnIfMissing('scores', 'plateauGenerations', (table) => {
        table.integer('plateauGenerations').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'restartEliteCount', (table) => {
        table.integer('restartEliteCount').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'restartPopulationRate', (table) => {
        table.float('restartPopulationRate').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'modelBestFitness', (table) => {
        table.float('modelBestFitness').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'modelAvgFitness', (table) => {
        table.float('modelAvgFitness').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'top10AvgScore', (table) => {
        table.float('top10AvgScore').notNullable().defaultTo(0);
      });
      await this.addColumnIfMissing('scores', 'medianScore', (table) => {
        table.float('medianScore').notNullable().defaultTo(0);
      });
    }

    this.isSetup = true;
  }

  async saveScore(input: ScoreInput): Promise<StoredScore> {
    await this.setup();

    const legacyInput = input as Record<string, unknown>;
    const row = {
      fitness: Number(input.fitness) || 0,
      averageFitness: Number(input.averageFitness ?? legacyInput.fitnessMedia) || 0,
      generation: Number(input.generation ?? legacyInput.geracao) || 0,
      createdAt: String(input.createdAt ?? legacyInput.criadoEm ?? nowAtMinusThreeIso()),
      solution: JSON.stringify(Array.isArray(input.solution ?? legacyInput.solucao) ? (input.solution ?? legacyInput.solucao) : []),
      generations: Number(input.generations) || 0,
      chromosomes: Number(input.chromosomes) || 0,
      selectionRate: Number(input.selectionRate) || 0,
      crossoverRate: Number(input.crossoverRate) || 0,
      mutationRate: Number(input.mutationRate) || 0,
      enableAdaptiveMutationOnPlateau: input.enableAdaptiveMutationOnPlateau ? 1 : 0,
      plateauMutationRate: Number(input.plateauMutationRate) || 0,
      seriesPerMutation: Number(input.seriesPerMutation) || 0,
      lifeExpectancy: Number(input.lifeExpectancy) || 0,
      activateLifeExpectancy: input.activateLifeExpectancy ? 1 : 0,
      processingOption: input.processingOption || 'rotation',
      enablePartialRestart: input.enablePartialRestart ? 1 : 0,
      plateauGenerations: Number(input.plateauGenerations) || 0,
      restartEliteCount: Number(input.restartEliteCount) || 0,
      restartPopulationRate: Number(input.restartPopulationRate) || 0,
      modelBestFitness: Number(input.modelBestFitness) || 0,
      modelAvgFitness: Number(input.modelAvgFitness) || 0,
      top10AvgScore: Number(input.top10AvgScore) || 0,
      medianScore: Number(input.medianScore) || 0,
    };

    const inserted = await this.db('scores').insert(row);
    const insertedId = Array.isArray(inserted) ? Number(inserted[0]) : Number(inserted);

    const saved = await this.db<StoredScoreDbRow>('scores').where({ id: insertedId }).first();
    if (!saved) {
      throw new Error('Failed to retrieve saved score.');
    }

    return this.hydrateScore(saved) as unknown as StoredScore;
  }

  async deleteScore(id: number): Promise<boolean> {
    await this.setup();

    const deleted = await this.db('scores').where({ id }).delete();
    return deleted > 0;
  }

  async listScores(limit = 50): Promise<StoredScore[]> {
    await this.setup();

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 50;
    const rows = await this.db<StoredScoreDbRow>('scores').select('*').orderBy('id', 'desc').limit(safeLimit);
    return rows.map((row) => this.hydrateScore(row) as unknown as StoredScore);
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}