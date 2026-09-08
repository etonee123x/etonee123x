import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FILE_TYPES, ITEM_TYPES } from '@/shared/domain/file-types/file-types.domain';
import { AppError } from '@/shared/errors/app.error';
import { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { FolderDataService } from '@/modules/folder-data/services/folder-data.service';

const buildStoredFile = (fileName: string) => {
  return {
    name: fileName,
    extension: path.extname(fileName).slice(1) || null,
    itemType: ITEM_TYPES.FILE,
    _meta: {
      createdAt: 1,
      updatedAt: 1,
    },
    src: `/mock/${fileName}`,
    fileType: FILE_TYPES.UNKNOWN,
  };
};

describe('FolderDataService', () => {
  const temporaryDirectories: Array<string> = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map(async (directory) => {
        await fs.rm(directory, { recursive: true, force: true });
      }),
    );
    temporaryDirectories.length = 0;
  });

  it('throws 404 for unknown path', async () => {
    const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-data-'));
    temporaryDirectories.push(rootDirectory);

    const filesService = {
      getStoredFile: vi.fn(),
    };

    const service = new FolderDataService({
      filesLocation: new FilesLocation({ fs: rootDirectory, src: '/content' }),
      filesService: filesService as never,
    });

    await expect(service.getFolderData({ pathAsRelativeUrl: 'missing' })).rejects.toBeInstanceOf(AppError);
  });

  it('returns folders and files for directory path and ignores .git', async () => {
    const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-data-'));
    temporaryDirectories.push(rootDirectory);

    const albumDirectory = path.join(rootDirectory, 'album');
    await fs.mkdir(path.join(albumDirectory, 'nested'), { recursive: true });
    await fs.mkdir(path.join(albumDirectory, '.git'), { recursive: true });
    await fs.writeFile(path.join(albumDirectory, 'song.mp3'), Buffer.from('song'));

    // FolderDataService consumes cache-aware inspection rather than raw inspector output.
    const filesService = {
      getFileInspection: vi.fn(async (parameters: { key: string }) => {
        return buildStoredFile(path.basename(parameters.key));
      }),
    };

    const service = new FolderDataService({
      filesLocation: new FilesLocation({ fs: rootDirectory, src: '/content' }),
      filesService: filesService as never,
    });

    const result = await service.getFolderData({ pathAsRelativeUrl: 'album' });

    expect(result.file).toBeNull();
    expect(result.pathDirectory).toBe('album');
    expect(
      result.folders.map((folder) => {
        return folder.name;
      }),
    ).toEqual(['nested']);
    expect(
      result.files.map((file) => {
        return file.name;
      }),
    ).toEqual(['song.mp3']);
    expect(filesService.getFileInspection).toHaveBeenCalledWith({
      key: 'album/song.mp3',
    });
  });

  it('returns file info when requested path is a file', async () => {
    const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-data-'));
    temporaryDirectories.push(rootDirectory);

    const albumDirectory = path.join(rootDirectory, 'album');
    await fs.mkdir(albumDirectory, { recursive: true });
    await fs.writeFile(path.join(albumDirectory, 'song.mp3'), Buffer.from('song'));

    // Keep mock aligned with FilesService's public inspection method.
    const filesService = {
      getFileInspection: vi.fn(async (parameters: { key: string }) => {
        return buildStoredFile(path.basename(parameters.key));
      }),
    };

    const service = new FolderDataService({
      filesLocation: new FilesLocation({ fs: rootDirectory, src: '/content' }),
      filesService: filesService as never,
    });

    const result = await service.getFolderData({ pathAsRelativeUrl: 'album/song.mp3' });

    expect(result.file).not.toBeNull();
    expect(result.file?.path).toBe('album/song.mp3');
    expect(result.pathDirectory).toBe('album');
    expect(filesService.getFileInspection).toHaveBeenNthCalledWith(1, { key: 'album/song.mp3' });
  });

  it('rejects path traversal attempts with 400', async () => {
    const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-data-'));
    temporaryDirectories.push(rootDirectory);

    const service = new FolderDataService({
      filesLocation: new FilesLocation({ fs: rootDirectory, src: '/content' }),
      filesService: {} as never,
    });

    await expect(service.getFolderData({ pathAsRelativeUrl: '../etc/passwd' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
