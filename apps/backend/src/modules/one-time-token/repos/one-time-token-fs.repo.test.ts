import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { appConfig } from '@/config/app-config';
import { FsDatabaseFile } from '@/infrastructure/fs-database-file';
import { OneTimeTokenFsRepo } from './one-time-token-fs.repo';

describe('OneTimeTokenFsRepo', () => {
  let databaseDirectory: string | undefined;
  const previousDatabasePath = appConfig.databasePath;

  afterEach(async () => {
    (appConfig as unknown as { databasePath: string }).databasePath = previousDatabasePath;

    if (databaseDirectory) {
      await fs.rm(databaseDirectory, { recursive: true, force: true });
      databaseDirectory = undefined;
    }
  });

  it('deletes the token record after it is consumed', async () => {
    databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'one-time-token-repo-'));
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<{ tokenHash: string }>({ fileName: 'one-time-tokens.json' });
    const repo = new OneTimeTokenFsRepo({ fsDatabaseFile: databaseFile });

    await repo.create({ tokenHash: 'token-hash' });

    await expect(repo.consume({ tokenHash: 'token-hash' })).resolves.toBeTypeOf('number');
    await expect(repo.consume({ tokenHash: 'token-hash' })).resolves.toBeNull();
    await expect(databaseFile.read()).resolves.toEqual([]);
  });

  it('clears every token record and returns the number removed', async () => {
    databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'one-time-token-repo-'));
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const databaseFile = new FsDatabaseFile<{ tokenHash: string }>({ fileName: 'one-time-tokens.json' });
    const repo = new OneTimeTokenFsRepo({ fsDatabaseFile: databaseFile });

    await repo.create({ tokenHash: 'first-hash' });
    await repo.create({ tokenHash: 'second-hash' });

    await expect(repo.clearAll()).resolves.toBe(2);
    await expect(databaseFile.read()).resolves.toEqual([]);
  });
});
