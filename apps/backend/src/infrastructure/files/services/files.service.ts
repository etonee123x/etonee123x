import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';

import type { StoredFile } from '@/shared/domain/stored-file/stored-file';
import type { FileInspector } from '../inspectors/file-inspector';
import type { FilesStorage } from '../storages/files-storage';
import { FileInspectorCacheService } from './file-inspector-cache.service';

const CONTENT_WARM_UP_CONCURRENCY = 6;
const PROHIBITED_WARM_UP_DIRECTORY_NAMES = new Set(['.git']);

interface WarmUpContentDirectoryResult {
  directory: string;
  filesCount: number;
}

export interface WarmUpContentResult {
  filesCount: number;
  directories: Array<WarmUpContentDirectoryResult>;
}

export class FilesService {
  private static getFileKeys = async function* (directory: string, rootDirectory: string): AsyncGenerator<string> {
    const directoryHandle = await nodeFsPromises.opendir(directory);

    for await (const directoryEntry of directoryHandle) {
      const path = nodePath.join(directory, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        if (!PROHIBITED_WARM_UP_DIRECTORY_NAMES.has(directoryEntry.name)) {
          yield* FilesService.getFileKeys(path, rootDirectory);
        }
        continue;
      }

      if (directoryEntry.isFile()) {
        yield nodePath.relative(rootDirectory, path).split(nodePath.sep).join('/');
      }
    }
  };

  private static getWarmUpDirectory(key: string): string {
    // Group by the exact containing directory, so nested albums are not collapsed into the top-level folder.
    return key.includes('/') ? nodePath.posix.dirname(key) : '.';
  }

  private readonly filesStorage: FilesStorage;

  private readonly fileInspector: FileInspector;

  private readonly fileInspectorCacheService: FileInspectorCacheService | null;

  constructor(parameters: {
    filesStorage: FilesStorage;
    fileInspector: FileInspector;
    fileInspectorCacheService: FileInspectorCacheService | null;
  }) {
    this.filesStorage = parameters.filesStorage;
    this.fileInspector = parameters.fileInspector;
    // Composition roots must make the disk-cache dependency explicit.
    this.fileInspectorCacheService = parameters.fileInspectorCacheService;
  }

  async upload(parameters: { buffer: Buffer; key: string }): Promise<StoredFile> {
    await this.filesStorage.put(parameters);

    const storedFile = await this.getStoredFile({ key: parameters.key });

    return storedFile;
  }

  async delete(parameters: { key: string }): Promise<StoredFile> {
    const storedFile = await this.getStoredFile(parameters);

    await this.filesStorage.delete(parameters);

    return storedFile;
  }

  async exists(parameters: { key: string }): Promise<boolean> {
    return this.filesStorage.exists(parameters);
  }

  async getStoredFile(parameters: { key: string }): Promise<StoredFile> {
    return this.fileInspector.inspect(parameters);
  }

  async getFileInspection(parameters: { key: string }): Promise<StoredFile> {
    const path = this.filesStorage.getPath(parameters);
    const stat = await nodeFsPromises.stat(path);
    // This cheap filesystem state determines whether inspector output is still valid.
    const cacheParameters = { path, size: stat.size, mtimeMs: stat.mtimeMs };
    const cachedInspection = await this.fileInspectorCacheService?.get(cacheParameters);

    if (cachedInspection) {
      // HIT must avoid FileInspector and its expensive metadata readers entirely.
      return cachedInspection;
    }

    // MISS keeps the public inspection route centralized before caching it for later requests and warm-up calls.
    const inspection = await this.getStoredFile(parameters);
    await this.fileInspectorCacheService?.set({ ...cacheParameters, inspection });

    return inspection;
  }

  async warmUpContent(parameters: { directory: string }): Promise<WarmUpContentResult> {
    const pending = new Map<string, Promise<string>>();
    const warmedFilesByDirectory = new Map<string, number>();

    for await (const key of FilesService.getFileKeys(parameters.directory, parameters.directory)) {
      const task = (async () => {
        await this.getFileInspection({ key });
        const directory = FilesService.getWarmUpDirectory(key);

        // Count only successful inspections so script logs describe warmed files, not scheduled work.
        warmedFilesByDirectory.set(directory, (warmedFilesByDirectory.get(directory) ?? 0) + 1);
        return key;
      })();
      pending.set(key, task);

      // Bound CPU and I/O pressure while retaining streaming traversal.
      if (pending.size >= CONTENT_WARM_UP_CONCURRENCY) {
        pending.delete(await Promise.race(pending.values()));
      }
    }

    await Promise.all(pending.values());

    let filesCount = 0;
    for (const directoryFilesCount of warmedFilesByDirectory.values()) {
      filesCount += directoryFilesCount;
    }

    return {
      filesCount,
      directories: [...warmedFilesByDirectory]
        .toSorted(([left], [right]) => {
          return left.localeCompare(right);
        })
        .map(([directory, directoryFilesCount]) => {
          return { directory, filesCount: directoryFilesCount };
        }),
    };
  }
}
