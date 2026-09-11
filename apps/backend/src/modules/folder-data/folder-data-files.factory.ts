import { appConfig } from '@/config/app-config';
import { AudioFileInspector } from '@/infrastructure/files/inspectors/audio.file-inspector';
import { FileInspector } from '@/infrastructure/files/inspectors/file-inspector';
import { ImageFileInspector } from '@/infrastructure/files/inspectors/image.file-inspector';
import { UnknownFileInspector } from '@/infrastructure/files/inspectors/unknown.file-inspector';
import { VideoFileInspector } from '@/infrastructure/files/inspectors/video.file-inspector';
import { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { AudioCoverService } from '@/infrastructure/files/services/audio-cover.service';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { FilesService } from '@/infrastructure/files/services/files.service';
import { FsFilesStorage } from '@/infrastructure/files/storages/fs-files-storage';

export const createFolderDataFiles = (): { filesLocation: FilesLocation; filesService: FilesService } => {
  const filesLocation = new FilesLocation({ fs: appConfig.contentPath, src: '/content' });
  const filesStorage = new FsFilesStorage({ filesLocation });
  const audioCoverService = new AudioCoverService({ directory: appConfig.audioCoversPath });

  // Folder-data is the owner of content inspection dependencies, including extracted audio covers.
  const audioFileInspector = new AudioFileInspector({ filesStorage, audioCoverService });
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
  const fileInspectorCacheService = appConfig.fileInspectorCachePath
    ? new FileInspectorCacheService({ directory: appConfig.fileInspectorCachePath })
    : null;

  return {
    filesLocation,
    filesService: new FilesService({
      filesStorage,
      fileInspector,
      fileInspectorCacheService,
    }),
  };
};
