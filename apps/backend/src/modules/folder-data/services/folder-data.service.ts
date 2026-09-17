import nodePath from 'node:path';
import nodeFsPromises from 'node:fs/promises';
import { ITEM_TYPES } from '@/shared/domain/file-types/file-types.domain';
import { AppError } from '@/shared/errors/app.error';
import type { FilesService } from '@/infrastructure/files/services/files.service';
import type { StoredFile } from '@/shared/domain/stored-file/stored-file';
import type { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { resolveSafePath } from '@/utils/safe-path';

const PROHIBITED_ELEMENTS_NAMES = new Set(['.git']);

const encodeUrlPath = (path: string) => {
  return path
    .split('/')
    .map((segment) => {
      return encodeURIComponent(segment);
    })
    .join('/');
};

const getStat = async (parameters: { path: string }) => {
  try {
    await nodeFsPromises.access(parameters.path);
  } catch {
    return null;
  }

  return nodeFsPromises.stat(parameters.path);
};

export class FolderDataService {
  private readonly filesLocation: FilesLocation;
  private readonly filesService: FilesService;

  constructor(parameters: { filesService: FilesService; filesLocation: FilesLocation }) {
    this.filesService = parameters.filesService;
    this.filesLocation = parameters.filesLocation;
  }

  private pathAsRelativeUrlToSystemPath(pathAsRelativeUrl: string) {
    return resolveSafePath(this.filesLocation.fs, pathAsRelativeUrl);
  }

  /**
   * Returns every file and folder path with its created/updated timestamps, skipping full file inspection (e.g. for sitemap generation).
   */
  async getAllFilePaths(): Promise<Array<{ path: string; createdAt: number; updatedAt: number }>> {
    const collectPaths = async (
      relativeDirectory: string,
    ): Promise<Array<{ path: string; createdAt: number; updatedAt: number }>> => {
      const items = await nodeFsPromises.readdir(this.pathAsRelativeUrlToSystemPath(relativeDirectory), {
        withFileTypes: true,
      });

      const nestedPaths = await Promise.all(
        items
          .filter((item) => {
            return !PROHIBITED_ELEMENTS_NAMES.has(item.name);
          })
          .map(async (item) => {
            const pathAsRelativeUrl = nodePath.posix.join(relativeDirectory, item.name);
            const statAwaited = await nodeFsPromises.stat(this.pathAsRelativeUrlToSystemPath(pathAsRelativeUrl));
            const ownEntry = {
              path: encodeUrlPath(pathAsRelativeUrl),
              createdAt: statAwaited.birthtimeMs,
              updatedAt: statAwaited.mtimeMs,
            };

            if (item.isDirectory()) {
              return [ownEntry, ...(await collectPaths(pathAsRelativeUrl))];
            }

            return [ownEntry];
          }),
      );

      return nestedPaths.flat();
    };

    return collectPaths('/');
  }

  /**
  Finds the directory containing the newest file using one recursive filesystem pass.
  */
  async getNewestFolderData() {
    const findNewestFile = async (relativeDirectory: string, latest: { mtime: number; path: string } | null) => {
      const items = await nodeFsPromises.readdir(this.pathAsRelativeUrlToSystemPath(relativeDirectory), {
        withFileTypes: true,
      });
      let newestFile = latest;

      for (const item of items) {
        if (PROHIBITED_ELEMENTS_NAMES.has(item.name)) {
          continue;
        }

        const relativePath = nodePath.posix.join(relativeDirectory, item.name);
        const stat = await nodeFsPromises.stat(this.pathAsRelativeUrlToSystemPath(relativePath));

        if (item.isDirectory()) {
          newestFile = await findNewestFile(relativePath, newestFile);
        } else if (!newestFile || stat.mtimeMs > newestFile.mtime) {
          newestFile = { mtime: stat.mtimeMs, path: relativePath };
        }
      }

      return newestFile;
    };

    const newestFile = await findNewestFile('/', null);
    if (!newestFile) {
      throw new AppError(404, 'No files were found');
    }

    return this.getFolderData({ pathAsRelativeUrl: nodePath.posix.dirname(newestFile.path) });
  }

  async getFolderData(parameters: { pathAsRelativeUrl: string }) {
    const statAwaited = await getStat({
      path: this.pathAsRelativeUrlToSystemPath(parameters.pathAsRelativeUrl),
    });

    if (!statAwaited) {
      throw new AppError(404, 'Path was not found');
    }

    const {
      //
      file,
      currentDirectory,
    } = statAwaited.isFile()
      ? {
          file: {
            path: parameters.pathAsRelativeUrl,
            ...(await this.filesService.getFileInspection({ key: parameters.pathAsRelativeUrl })),
          },
          currentDirectory: nodePath.posix.dirname(parameters.pathAsRelativeUrl),
        }
      : {
          file: null,
          currentDirectory: parameters.pathAsRelativeUrl,
        };

    const directoryItems = await nodeFsPromises.readdir(this.pathAsRelativeUrlToSystemPath(currentDirectory), {
      withFileTypes: true,
    });

    const { folders, files } = await directoryItems.reduce<
      Promise<{
        folders: Array<{
          name: string;
          itemType: (typeof ITEM_TYPES)['FOLDER'];
          _meta: {
            createdAt: number;
            updatedAt: number;
          };
          path: string;
        }>;
        files: Array<
          StoredFile & {
            path: string;
          }
        >;
      }>
    >(
      async (promiseItems, item) => {
        if (PROHIBITED_ELEMENTS_NAMES.has(item.name)) {
          return promiseItems;
        }

        const items = await promiseItems;

        const pathAsRelativeUrl = nodePath.posix.join(currentDirectory, item.name);
        const systemPath = this.pathAsRelativeUrlToSystemPath(pathAsRelativeUrl);

        const statAwaited = await getStat({
          path: systemPath,
        });

        if (!statAwaited) {
          return promiseItems;
        }

        const baseItem = {
          name: item.name,
          _meta: {
            createdAt: statAwaited.birthtimeMs,
            updatedAt: statAwaited.mtimeMs,
          },
        };

        return item.isDirectory()
          ? {
              ...items,
              folders: [
                ...items.folders,
                {
                  ...baseItem,
                  path: pathAsRelativeUrl,
                  itemType: ITEM_TYPES.FOLDER,
                },
              ],
            }
          : {
              ...items,
              files: [
                ...items.files,
                {
                  ...baseItem,
                  path: pathAsRelativeUrl,
                  ...(await this.filesService.getFileInspection({ key: pathAsRelativeUrl })),
                },
              ],
            };
      },
      Promise.resolve({ files: [], folders: [] }),
    );

    const pathDirectory = (() => {
      if (file && file.name === parameters.pathAsRelativeUrl.split('/').at(-1)) {
        return parameters.pathAsRelativeUrl.split('/').slice(0, -1).join('/');
      }

      return parameters.pathAsRelativeUrl.length > 1 && parameters.pathAsRelativeUrl.endsWith('/')
        ? parameters.pathAsRelativeUrl.slice(0, -1)
        : parameters.pathAsRelativeUrl;
    })();

    return {
      folders: folders.map((folder) => {
        return {
          ...folder,
          path: encodeUrlPath(folder.path),
        };
      }),
      files: files.map((storedFile) => {
        return {
          ...storedFile,
          path: encodeUrlPath(storedFile.path),
          src: encodeUrlPath(storedFile.src),
        };
      }),
      file: file
        ? {
            ...file,
            path: encodeUrlPath(file.path),
            src: encodeUrlPath(file.src),
          }
        : null,
      pathDirectory: encodeUrlPath(pathDirectory),
    };
  }
}
