import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from '@/shared/errors/app.error';
import { isNil } from '@/utils/is-nil';
import { appConfig } from '@/config/app-config';

export interface Meta {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export class FsDatabaseFile<
  const Entity extends object,
  const Row extends Omit<Entity, '_meta'> & {
    _meta: Meta;
  } = Omit<Entity, '_meta'> & {
    _meta: Meta;
  },
> {
  private static getUpdatedAt(): number {
    return Date.now();
  }

  private static getCreatedAt(): number {
    return Date.now();
  }

  private static generateId(): string {
    return randomUUID();
  }

  private readonly pathToFile: string;

  constructor(parameters: { fileName: `${string}.json` }) {
    const tableDatabasePath = appConfig.databasePath;

    this.pathToFile = nodePath.join(tableDatabasePath, parameters.fileName);
  }

  private async ensureInit() {
    try {
      await nodeFsPromises.access(this.pathToFile);
    } catch {
      await nodeFsPromises.mkdir(nodePath.dirname(this.pathToFile), { recursive: true });
      await nodeFsPromises.writeFile(this.pathToFile, JSON.stringify([]));
    }
  }

  async read(): Promise<Array<Row>> {
    await this.ensureInit();

    const file = await nodeFsPromises.readFile(this.pathToFile, { encoding: 'utf8' });

    return JSON.parse(file) as Array<Row>;
  }

  /**
   * Drops every row while keeping the database file initialized.
   */
  async drop(): Promise<void> {
    await this.ensureInit();
    await nodeFsPromises.writeFile(this.pathToFile, JSON.stringify([]));
  }

  async readRowById(parameters: { id: string }): Promise<Row> {
    await this.ensureInit();

    const rows = await this.read();

    const row = rows.find((row) => {
      return row._meta.id === parameters.id;
    });

    if (!row) {
      throw new AppError(404, 'Row not found');
    }

    return row;
  }

  async writeEntityOrRow(id: string | undefined, entityOrRow: Entity | Row): Promise<Row> {
    await this.ensureInit();

    const row = {
      ...entityOrRow,
      _meta: {
        id: '_meta' in entityOrRow ? entityOrRow._meta.id : FsDatabaseFile.generateId(),
        createdAt: '_meta' in entityOrRow ? entityOrRow._meta.createdAt : FsDatabaseFile.getCreatedAt(),
        updatedAt: FsDatabaseFile.getUpdatedAt(),
      },
    } as Row;

    const rows = await this.read();
    if (isNil(id)) {
      await nodeFsPromises.writeFile(this.pathToFile, JSON.stringify([row, ...rows]));

      return row;
    }

    const existingRowIndex = rows.findIndex((row) => {
      return row._meta.id === id;
    });

    if (existingRowIndex === -1) {
      throw new AppError(404, 'Row now found');
    }

    await nodeFsPromises.writeFile(this.pathToFile, JSON.stringify(rows.with(existingRowIndex, row)));

    return row;
  }

  async deleteRowById(parameters: { id: string }): Promise<Row> {
    await this.ensureInit();

    const rows = await this.read();
    const row = rows.find((row) => {
      return row._meta.id === parameters.id;
    });

    if (!row) {
      throw new AppError(404, 'Row not found');
    }

    const updatedRows = rows.filter((row) => {
      return row._meta.id !== parameters.id;
    });

    await nodeFsPromises.writeFile(this.pathToFile, JSON.stringify(updatedRows));

    return row;
  }
}
