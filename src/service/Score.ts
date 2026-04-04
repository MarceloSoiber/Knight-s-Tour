import pkg from 'knex';
const { knex } = pkg;
import type { Knex } from 'knex';
import ScoreModel from '../model/Score.js';

export type ScoreInput = {
  fitness?: number;
  fitnessMedia?: number;
  geracao?: number;
  generations?: number;
  chromosomes?: number;
  selectionRate?: number;
  crossoverRate?: number;
  mutationRate?: number;
  seriesPerMutation?: number;
  lifeExpectancy?: number;
  activateLifeExpectancy?: boolean;
  processingOption?: string;
  criadoEm?: string;
};

export type StoredScore = {
  id: number;
  fitness: number;
  fitnessMedia: number;
  geracao: number;
  criadoEm: string;
  generations: number;
  chromosomes: number;
  selectionRate: number;
  crossoverRate: number;
  mutationRate: number;
  seriesPerMutation: number;
  lifeExpectancy: number;
  activateLifeExpectancy: number;
  processingOption: string;
};

type ScoreClass = new (configForm?: Record<string, unknown>) => {
  setId?: (id: number | null) => void;
  setFitness?: (fitness: number) => void;
  setFitnessMedia?: (fitnessMedia: number) => void;
  setGeracao?: (geracao: number) => void;
  setCriadoEm?: (criadoEm: string | Date) => void;
  setGenerations?: (generations: number) => void;
  setChromosomes?: (chromosomes: number) => void;
  setSelectionRate?: (selectionRate: number) => void;
  setCrossoverRate?: (crossoverRate: number) => void;
  setMutationRate?: (mutationRate: number) => void;
  setSeriesPerMutation?: (seriesPerMutation: number) => void;
  setLifeExpectancy?: (lifeExpectancy: number) => void;
  setActivateLifeExpectancy?: (activateLifeExpectancy: boolean) => void;
  setProcessingOption?: (processingOption: string) => void;
  toJSON?: () => unknown;
};

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

  private hydrateScore(row: StoredScore) {
    const score = new this.ScoreClass();

    score.setId?.(row.id);
    score.setFitness?.(row.fitness);
    score.setFitnessMedia?.(row.fitnessMedia);
    score.setGeracao?.(row.geracao);
    score.setCriadoEm?.(row.criadoEm);
    score.setGenerations?.(row.generations);
    score.setChromosomes?.(row.chromosomes);
    score.setSelectionRate?.(row.selectionRate);
    score.setCrossoverRate?.(row.crossoverRate);
    score.setMutationRate?.(row.mutationRate);
    score.setSeriesPerMutation?.(row.seriesPerMutation);
    score.setLifeExpectancy?.(row.lifeExpectancy);
    score.setActivateLifeExpectancy?.(Boolean(row.activateLifeExpectancy));
    score.setProcessingOption?.(row.processingOption);

    return score;
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;

    const exists = await this.db.schema.hasTable('scores');
    if (!exists) {
      await this.db.schema.createTable('scores', (table) => {
        table.increments('id').primary();
        table.float('fitness').notNullable().defaultTo(0);
        table.float('fitnessMedia').notNullable().defaultTo(0);
        table.integer('geracao').notNullable().defaultTo(0);
        table.text('criadoEm').notNullable();

        table.integer('generations').notNullable().defaultTo(0);
        table.integer('chromosomes').notNullable().defaultTo(0);
        table.float('selectionRate').notNullable().defaultTo(0);
        table.float('crossoverRate').notNullable().defaultTo(0);
        table.float('mutationRate').notNullable().defaultTo(0);
        table.integer('seriesPerMutation').notNullable().defaultTo(0);
        table.integer('lifeExpectancy').notNullable().defaultTo(0);
        table.boolean('activateLifeExpectancy').notNullable().defaultTo(false);
        table.string('processingOption').notNullable().defaultTo('rotation');
      });
    }

    this.isSetup = true;
  }

  async saveScore(input: ScoreInput): Promise<StoredScore> {
    await this.setup();

    const row = {
      fitness: Number(input.fitness) || 0,
      fitnessMedia: Number(input.fitnessMedia) || 0,
      geracao: Number(input.geracao) || 0,
      criadoEm: input.criadoEm || new Date().toISOString(),
      generations: Number(input.generations) || 0,
      chromosomes: Number(input.chromosomes) || 0,
      selectionRate: Number(input.selectionRate) || 0,
      crossoverRate: Number(input.crossoverRate) || 0,
      mutationRate: Number(input.mutationRate) || 0,
      seriesPerMutation: Number(input.seriesPerMutation) || 0,
      lifeExpectancy: Number(input.lifeExpectancy) || 0,
      activateLifeExpectancy: input.activateLifeExpectancy ? 1 : 0,
      processingOption: input.processingOption || 'rotation',
    };

    const inserted = await this.db('scores').insert(row);
    const insertedId = Array.isArray(inserted) ? Number(inserted[0]) : Number(inserted);

    const saved = await this.db<StoredScore>('scores').where({ id: insertedId }).first();
    if (!saved) {
      throw new Error('Falha ao recuperar score salvo.');
    }

    return this.hydrateScore(saved) as unknown as StoredScore;
  }

  async listScores(limit = 50): Promise<StoredScore[]> {
    await this.setup();

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 50;
    const rows = await this.db<StoredScore>('scores').select('*').orderBy('id', 'desc').limit(safeLimit);
    return rows.map((row) => this.hydrateScore(row) as unknown as StoredScore);
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }
}