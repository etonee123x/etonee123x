import { createHash } from 'node:crypto';
import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';
import sharp from 'sharp';
import { DirectoryCleaner, type DirectoryCleanerResult } from './directory-cleaner.service';

const COVER_FORMAT_EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const COVER_MAX_SIZE_PX = 512;
const COVER_WEBP_QUALITY = 80;
const COVER_SRC_BASE = '/covers';

export class AudioCoverService {
  private static async optimize(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; extension: string; width: number; height: number }> {
    try {
      // Album art is rendered as a small square preview, so bounded WebP avoids storing huge embedded originals.
      const optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: COVER_MAX_SIZE_PX, height: COVER_MAX_SIZE_PX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: COVER_WEBP_QUALITY })
        .toBuffer();

      const metadata = await sharp(optimizedBuffer).metadata();

      return { buffer: optimizedBuffer, extension: 'webp', width: metadata.width, height: metadata.height };
    } catch {
      // Bad or exotic embedded pictures should not break audio inspection; store original bytes instead.
      return { buffer, extension: 'bin', width: 0, height: 0 };
    }
  }

  private static getExtension(format: string): string {
    const normalizedFormat = format.trim().toLowerCase();
    const mappedExtension = COVER_FORMAT_EXTENSIONS.get(normalizedFormat);

    if (mappedExtension) {
      return mappedExtension;
    }

    // Unknown image formats still get stable, path-safe names for browser/cache use.
    return (
      normalizedFormat
        .split('/', 2)
        .at(1)
        ?.replaceAll(/[^a-z0-9]/g, '') || 'bin'
    );
  }

  private static isExistingFileError(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'EEXIST';
  }

  private readonly directory: string;

  private readonly directoryCleaner = new DirectoryCleaner();

  constructor(parameters: { directory: string }) {
    // Caller owns runtime location; service owns deterministic file naming inside it.
    this.directory = parameters.directory;
  }

  async save(parameters: { buffer: Buffer; format: string }): Promise<{ src: string; width: number; height: number }> {
    const optimizedCover = await AudioCoverService.optimize(parameters.buffer);
    const extension =
      optimizedCover.extension === 'bin' ? AudioCoverService.getExtension(parameters.format) : optimizedCover.extension;
    const hash = createHash('sha256').update(optimizedCover.buffer).digest('hex');
    const fileName = `${hash}.${extension}`;
    const filePath = nodePath.join(this.directory, fileName);

    await nodeFsPromises.mkdir(this.directory, { recursive: true });

    try {
      // Atomic create makes equal album covers converge on one file across concurrent inspections.
      await nodeFsPromises.writeFile(filePath, optimizedCover.buffer, { flag: 'wx' });
    } catch (error) {
      if (!AudioCoverService.isExistingFileError(error)) {
        throw error;
      }
    }

    return {
      src: nodePath.posix.join(COVER_SRC_BASE, fileName),
      width: optimizedCover.width,
      height: optimizedCover.height,
    };
  }

  async clear(): Promise<DirectoryCleanerResult> {
    // Cover files are derived from audio metadata; removing the directory lets later inspection rebuild it.
    return this.directoryCleaner.clear(this.directory);
  }
}
