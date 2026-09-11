import { createHash, randomUUID } from 'node:crypto';
import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';

import type { StoredFile } from '@/shared/domain/stored-file/stored-file';
import { DirectoryCleaner, type DirectoryCleanerResult } from './directory-cleaner.service';

interface FileInspectorCacheEntry {
  // File state is persisted alongside inspection so a malformed or mismatched entry never becomes a HIT.
  path: string;
  size: number;
  mtimeMs: number;
  inspection: StoredFile;
}

// Content changes are represented by stat metadata; absolute path separates identical files in different locations.
const createCacheKey = (parameters: { path: string; size: number; mtimeMs: number }) => {
  return createHash('sha256').update(`${parameters.path}:${parameters.size}:${parameters.mtimeMs}`).digest('hex');
};

export class FileInspectorCacheService {
  private readonly directoryCleaner = new DirectoryCleaner();

  private readonly directory: string;

  constructor(parameters: { directory: string }) {
    // Tests may isolate entries in a temporary directory; callers supply runtime configuration explicitly.
    this.directory = parameters.directory;
  }

  private getCachePath(parameters: { path: string; size: number; mtimeMs: number }): string {
    return nodePath.join(this.directory, `${createCacheKey(parameters)}.json`);
  }

  private isMissingDirectoryError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }

  async get(parameters: { path: string; size: number; mtimeMs: number }): Promise<StoredFile | null> {
    const cachePath = this.getCachePath(parameters);

    try {
      const entry = JSON.parse(await nodeFsPromises.readFile(cachePath, 'utf8')) as FileInspectorCacheEntry;

      // Key collisions or stale/corrupt content must never bypass expensive inspection.
      if (entry.path !== parameters.path || entry.size !== parameters.size || entry.mtimeMs !== parameters.mtimeMs) {
        return null;
      }

      return entry.inspection;
    } catch {
      return null;
    }
  }

  async set(parameters: { path: string; size: number; mtimeMs: number; inspection: StoredFile }): Promise<void> {
    await nodeFsPromises.mkdir(this.directory, { recursive: true });

    const cachePath = this.getCachePath(parameters);
    const temporaryPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
    const entry: FileInspectorCacheEntry = parameters;

    // Rename publishes only complete JSON to readers, including concurrent warm-up and request processes.
    await nodeFsPromises.writeFile(temporaryPath, JSON.stringify(entry));
    await nodeFsPromises.rename(temporaryPath, cachePath);
  }

  async clear(): Promise<DirectoryCleanerResult> {
    return this.directoryCleaner.clear(this.directory);
  }
}
