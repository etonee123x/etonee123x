import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';

export interface DirectoryCleanerResult {
  filesCount: number;
  bytes: number;
}

const EMPTY_DIRECTORY_CLEANER_RESULT: DirectoryCleanerResult = { filesCount: 0, bytes: 0 };

export class DirectoryCleaner {
  private static isMissingDirectoryError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }

  private static async getDirectoryStats(directory: string): Promise<DirectoryCleanerResult> {
    try {
      const directoryHandle = await nodeFsPromises.opendir(directory);
      let result = EMPTY_DIRECTORY_CLEANER_RESULT;

      for await (const directoryEntry of directoryHandle) {
        const path = nodePath.join(directory, directoryEntry.name);

        if (directoryEntry.isDirectory()) {
          const nestedResult = await this.getDirectoryStats(path);
          result = {
            filesCount: result.filesCount + nestedResult.filesCount,
            bytes: result.bytes + nestedResult.bytes,
          };
          continue;
        }

        if (directoryEntry.isFile()) {
          const stat = await nodeFsPromises.stat(path);
          result = { filesCount: result.filesCount + 1, bytes: result.bytes + stat.size };
        }
      }

      return result;
    } catch (error) {
      if (this.isMissingDirectoryError(error)) {
        return EMPTY_DIRECTORY_CLEANER_RESULT;
      }

      throw error;
    }
  }

  async clear(directory: string): Promise<DirectoryCleanerResult> {
    // Count before deletion so scripts can report what derived files were removed.
    const result = await DirectoryCleaner.getDirectoryStats(directory);
    await nodeFsPromises.rm(directory, { recursive: true, force: true });

    return result;
  }
}
