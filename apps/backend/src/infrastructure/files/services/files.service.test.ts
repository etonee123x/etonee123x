import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { FILE_TYPES, ITEM_TYPES } from '@/shared/domain/file-types/file-types.domain';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { FilesService } from '@/infrastructure/files/services/files.service';

describe('FilesService', () => {
  it('inspects every request when the cache has no directory', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'file-inspection-'));
    const filePath = path.join(directory, 'a.bin');
    await fs.writeFile(filePath, 'first');

    const fileInspector = {
      inspect: vi.fn().mockResolvedValue({ fileType: FILE_TYPES.UNKNOWN }),
    };
    const service = new FilesService({
      filesStorage: { getPath: vi.fn().mockReturnValue(filePath) } as never,
      fileInspector: fileInspector as never,
      // No cache service must inspect every request.
      fileInspectorCacheService: null,
    });

    try {
      await service.getFileInspection({ key: 'a.bin' });
      await service.getFileInspection({ key: 'a.bin' });

      expect(fileInspector.inspect).toHaveBeenCalledTimes(2);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('reuses disk inspection cache until file state changes', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'file-inspection-'));
    const filePath = path.join(directory, 'a.bin');
    const cacheDirectory = path.join(directory, 'cache');
    await fs.writeFile(filePath, 'first');

    const storedFile = {
      name: 'a.bin',
      extension: 'bin',
      itemType: ITEM_TYPES.FILE,
      _meta: { createdAt: 1, updatedAt: 2 },
      src: '/content/a.bin',
      fileType: FILE_TYPES.UNKNOWN,
    };
    const fileInspector = { inspect: vi.fn().mockResolvedValue(storedFile) };
    const service = new FilesService({
      filesStorage: { getPath: vi.fn().mockReturnValue(filePath) } as never,
      fileInspector: fileInspector as never,
      fileInspectorCacheService: new FileInspectorCacheService({ directory: cacheDirectory }),
    });

    try {
      await service.getFileInspection({ key: 'a.bin' });
      await service.getFileInspection({ key: 'a.bin' });

      expect(fileInspector.inspect).toHaveBeenCalledTimes(1);

      await fs.writeFile(filePath, 'second file state');
      await service.getFileInspection({ key: 'a.bin' });

      expect(fileInspector.inspect).toHaveBeenCalledTimes(2);
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('upload writes file and returns inspected metadata', async () => {
    const buffer = Buffer.from('abc');
    const storedFile = {
      name: 'a.bin',
      extension: 'bin',
      itemType: ITEM_TYPES.FILE,
      _meta: { createdAt: 1, updatedAt: 2 },
      src: '/uploads/a.bin',
      fileType: FILE_TYPES.UNKNOWN,
    };

    const filesStorage = {
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
      getPath: vi.fn(),
      getStoredFileBase: vi.fn(),
      getBuffer: vi.fn(),
      getStream: vi.fn(),
    };

    const fileInspector = {
      inspect: vi.fn().mockResolvedValue(storedFile),
    };

    const filesService = new FilesService({
      filesStorage: filesStorage,
      fileInspector: fileInspector as never,
      // Explicitly disable caching for this non-cache operation.
      fileInspectorCacheService: null,
    });

    const result = await filesService.upload({ key: 'a.bin', buffer });

    expect(filesStorage.put).toHaveBeenCalledWith({ key: 'a.bin', buffer });
    expect(fileInspector.inspect).toHaveBeenCalledWith({ key: 'a.bin' });
    expect(result).toEqual(storedFile);
  });

  it('delete returns stored file and delegates delete call', async () => {
    const filesStorage = {
      put: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
      getPath: vi.fn(),
      getStoredFileBase: vi.fn(),
      getBuffer: vi.fn(),
      getStream: vi.fn(),
    };

    const fileInspector = {
      inspect: vi.fn().mockResolvedValue({
        name: 'a.bin',
        extension: 'bin',
        itemType: ITEM_TYPES.FILE,
        _meta: { createdAt: 1, updatedAt: 2 },
        src: '/uploads/a.bin',
        fileType: FILE_TYPES.UNKNOWN,
      }),
    };

    const filesService = new FilesService({
      filesStorage: filesStorage,
      fileInspector: fileInspector as never,
      // Explicitly disable caching for this non-cache operation.
      fileInspectorCacheService: null,
    });

    const storedFile = await filesService.delete({ key: 'a.bin' });

    expect(filesStorage.delete).toHaveBeenCalledWith({ key: 'a.bin' });
    expect(fileInspector.inspect).toHaveBeenCalledWith({ key: 'a.bin' });
    expect(storedFile.fileType).toBe(FILE_TYPES.UNKNOWN);
  });

  it('exists delegates to storage', async () => {
    const filesStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
      getPath: vi.fn(),
      getStoredFileBase: vi.fn(),
      getBuffer: vi.fn(),
      getStream: vi.fn(),
    };

    const fileInspector = {
      inspect: vi.fn(),
    };

    const filesService = new FilesService({
      filesStorage: filesStorage,
      fileInspector: fileInspector as never,
      // Explicitly disable caching for this non-cache operation.
      fileInspectorCacheService: null,
    });

    await expect(filesService.exists({ key: 'missing.bin' })).resolves.toBe(false);
    expect(filesStorage.exists).toHaveBeenCalledWith({ key: 'missing.bin' });
  });

  it('warms up content inspection and groups successful files by containing directory', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'content-warm-up-'));
    const musicDirectory = path.join(directory, 'music', 'album');
    const imagesDirectory = path.join(directory, 'images');
    const gitDirectory = path.join(directory, '.git');

    await fs.mkdir(musicDirectory, { recursive: true });
    await fs.mkdir(imagesDirectory);
    await fs.mkdir(gitDirectory);
    await fs.writeFile(path.join(directory, 'root.txt'), 'root');
    await fs.writeFile(path.join(musicDirectory, 'track.mp3'), 'track');
    await fs.writeFile(path.join(imagesDirectory, 'cover.png'), 'cover');
    await fs.writeFile(path.join(gitDirectory, 'ignored.txt'), 'ignored');

    const fileInspector = { inspect: vi.fn().mockResolvedValue({ fileType: FILE_TYPES.UNKNOWN }) };
    const service = new FilesService({
      filesStorage: {
        getPath: ({ key }: { key: string }) => {
          return path.join(directory, key);
        },
      } as never,
      fileInspector: fileInspector as never,
      // Content warm-up can validate inspection without writing a persistent cache.
      fileInspectorCacheService: null,
    });

    try {
      const result = await service.warmUpContent({ directory });

      expect(result).toEqual({
        filesCount: 3,
        directories: [
          { directory: '.', filesCount: 1 },
          { directory: 'images', filesCount: 1 },
          { directory: 'music/album', filesCount: 1 },
        ],
      });
      expect(fileInspector.inspect).toHaveBeenCalledTimes(3);
      expect(fileInspector.inspect).toHaveBeenCalledWith({ key: 'root.txt' });
      expect(fileInspector.inspect).toHaveBeenCalledWith({ key: 'music/album/track.mp3' });
      expect(fileInspector.inspect).toHaveBeenCalledWith({ key: 'images/cover.png' });
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
