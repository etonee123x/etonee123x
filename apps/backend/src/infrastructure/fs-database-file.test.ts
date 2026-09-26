import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { FsDatabaseFile } from '@/infrastructure/fs-database-file';
import { appConfig } from '@/config/app-config';

interface Entity {
  text: string;
}

describe('FsDatabaseFile', () => {
  const temporaryDirectories: Array<string> = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map(async (directory) => {
        await fs.rm(directory, { recursive: true, force: true });
      }),
    );
    temporaryDirectories.length = 0;
  });

  it('uses initialized database configuration', () => {
    expect(() => {
      return new FsDatabaseFile<Entity>({ fileName: 'rows.json' });
    }).not.toThrow();
  });

  it('initializes storage and reads empty array', async () => {
    const databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-db-'));
    temporaryDirectories.push(databaseDirectory);
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<Entity>({ fileName: 'rows.json' });

    await expect(databaseFile.read()).resolves.toEqual([]);
    await expect(fs.access(path.join(databaseDirectory, 'rows.json'))).resolves.toBeUndefined();
  });

  it('drops all rows and leaves an initialized empty database file', async () => {
    const databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-db-'));
    temporaryDirectories.push(databaseDirectory);
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<Entity>({ fileName: 'rows.json' });
    await databaseFile.writeEntityOrRow(undefined, { text: 'row' });

    await databaseFile.drop();

    await expect(databaseFile.read()).resolves.toEqual([]);
    await expect(fs.access(path.join(databaseDirectory, 'rows.json'))).resolves.toBeUndefined();
  });

  it('creates, updates, reads and deletes rows', async () => {
    const databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-db-'));
    temporaryDirectories.push(databaseDirectory);
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<Entity>({ fileName: 'rows.json' });

    const createdRow = await databaseFile.writeEntityOrRow(undefined, { text: 'first' });

    expect(createdRow.text).toBe('first');
    expect(createdRow._meta.id).toBeTypeOf('string');

    const updatedRow = await databaseFile.writeEntityOrRow(createdRow._meta.id, {
      ...createdRow,
      text: 'updated',
    });

    expect(updatedRow._meta.id).toBe(createdRow._meta.id);
    expect(updatedRow.text).toBe('updated');

    await expect(databaseFile.readRowById({ id: createdRow._meta.id })).resolves.toMatchObject({ text: 'updated' });

    const deletedRow = await databaseFile.deleteRowById({ id: createdRow._meta.id });

    expect(deletedRow).toMatchObject({ text: 'updated' });
    await expect(databaseFile.readRowById({ id: createdRow._meta.id })).rejects.toMatchObject({ statusCode: 404 });

    const rawFileContent = await fs.readFile(path.join(databaseDirectory, 'rows.json'), 'utf8');
    expect(JSON.parse(rawFileContent)).toEqual([]);
  });

  it('returns not found errors for unknown rows', async () => {
    const databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-db-'));
    temporaryDirectories.push(databaseDirectory);
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<Entity>({ fileName: 'rows.json' });

    await expect(databaseFile.readRowById({ id: 'missing' })).rejects.toMatchObject({ statusCode: 404 });
    await expect(databaseFile.writeEntityOrRow('missing', { text: 'value' })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(databaseFile.deleteRowById({ id: 'missing' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
