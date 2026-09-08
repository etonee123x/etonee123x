import nodeFsPromises from 'node:fs/promises';

import type { StoredFile } from '@/shared/domain/stored-file/stored-file';
import type { FileInspector } from '../inspectors/file-inspector';
import type { FilesStorage } from '../storages/files-storage';
import { FileInspectorCacheService } from './file-inspector-cache.service';

export class FilesService {
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

    // MISS keeps the public inspection route centralized before caching it for later requests and warmups.
    const inspection = await this.getStoredFile(parameters);
    await this.fileInspectorCacheService?.set({ ...cacheParameters, inspection });

    return inspection;
  }
}
