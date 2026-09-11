import { Module } from '@/shared/module';
import { FolderDataController } from './controllers/folder-data.controller';
import { FolderDataService } from './services/folder-data.service';
import { FilesService } from '@/infrastructure/files/services/files.service';
import { FsFilesStorage } from '@/infrastructure/files/storages/fs-files-storage';
import { FileInspector } from '@/infrastructure/files/inspectors/file-inspector';
import { AudioFileInspector } from '@/infrastructure/files/inspectors/audio.file-inspector';
import { ImageFileInspector } from '@/infrastructure/files/inspectors/image.file-inspector';
import { VideoFileInspector } from '@/infrastructure/files/inspectors/video.file-inspector';
import { UnknownFileInspector } from '@/infrastructure/files/inspectors/unknown.file-inspector';
import { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { appConfig } from '@/config/app-config';
import { AudioCoverService } from '@/infrastructure/files/services/audio-cover.service';

export class FolderDataModule extends Module {
  constructor() {
    const contentPath = appConfig.contentPath;

    const filesLocation = new FilesLocation({ fs: contentPath, src: '/content' });

    const filesStorage = new FsFilesStorage({ filesLocation });
    const audioCoverService = new AudioCoverService({ directory: appConfig.audioCoversPath });

    // Keep each dependency named so folder-data composition remains inspectable and replaceable.
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

    // Cache service exists only when persistent cache storage is configured.
    const fileInspectorCacheService = appConfig.fileInspectorCachePath
      ? new FileInspectorCacheService({ directory: appConfig.fileInspectorCachePath })
      : null;

    const filesService = new FilesService({
      filesStorage,
      fileInspector,
      fileInspectorCacheService,
    });

    const folderDataService = new FolderDataService({ filesService, filesLocation });

    const folderDataController = new FolderDataController({ folderDataService });

    super({ controller: folderDataController });
  }
}
