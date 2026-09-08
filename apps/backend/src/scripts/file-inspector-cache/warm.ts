import 'dotenv/config';

import nodeFsPromises from 'node:fs/promises';
import nodePath from 'node:path';
import { appConfig } from '@/config/app-config';
import { AudioFileInspector } from '@/infrastructure/files/inspectors/audio.file-inspector';
import { FileInspector } from '@/infrastructure/files/inspectors/file-inspector';
import { ImageFileInspector } from '@/infrastructure/files/inspectors/image.file-inspector';
import { UnknownFileInspector } from '@/infrastructure/files/inspectors/unknown.file-inspector';
import { VideoFileInspector } from '@/infrastructure/files/inspectors/video.file-inspector';
import { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { FilesService } from '@/infrastructure/files/services/files.service';
import { FsFilesStorage } from '@/infrastructure/files/storages/fs-files-storage';

const CONCURRENCY = 6;
const PROHIBITED_DIRECTORY_NAMES = new Set(['.git']);

// Async traversal yields one key at a time instead of retaining the entire content tree in memory.
const getFileKeys = async function* (directory: string, rootDirectory: string): AsyncGenerator<string> {
  const directoryHandle = await nodeFsPromises.opendir(directory);

  for await (const directoryEntry of directoryHandle) {
    const path = nodePath.join(directory, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      if (!PROHIBITED_DIRECTORY_NAMES.has(directoryEntry.name)) {
        yield* getFileKeys(path, rootDirectory);
      }
      continue;
    }

    if (directoryEntry.isFile()) {
      yield nodePath.relative(rootDirectory, path).split(nodePath.sep).join('/');
    }
  }
};

const filesLocation = new FilesLocation({ fs: appConfig.contentPath, src: '/content' });
const filesStorage = new FsFilesStorage({ filesLocation });
// Named dependencies mirror the HTTP composition while keeping warmup's entrypoint self-contained.
const audioFileInspector = new AudioFileInspector({ filesStorage });
const imageFileInspector = new ImageFileInspector({ filesStorage });
const videoFileInspector = new VideoFileInspector({ filesStorage });
const unknownFileInspector = new UnknownFileInspector({ filesStorage });
const fileInspector = new FileInspector({
  fileInspectors: {
    audioFileInspector,
    imageFileInspector,
    videoFileInspector,
    unknownFileInspector,
  },
  filesStorage,
});
// Cache warmup needs persistent storage; an absent path disables it.
const fileInspectorCacheService = appConfig.fileInspectorCachePath
  ? new FileInspectorCacheService({ directory: appConfig.fileInspectorCachePath })
  : null;
const filesService = new FilesService({
  filesStorage,
  fileInspector,
  fileInspectorCacheService,
});
const pending = new Map<string, Promise<string>>();

for await (const key of getFileKeys(appConfig.contentPath, appConfig.contentPath)) {
  const task = (async () => {
    await filesService.getFileInspection({ key });
    return key;
  })();
  pending.set(key, task);

  // Bound CPU and I/O pressure while retaining streaming traversal.
  if (pending.size >= CONCURRENCY) {
    pending.delete(await Promise.race(pending.values()));
  }
}

await Promise.all(pending.values());
