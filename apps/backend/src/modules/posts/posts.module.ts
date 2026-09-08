import { Module } from '@/shared/module';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';
import { PostsFsDatabaseRepo } from './repos/posts-fs-database.repo';
import { FilesService } from '@/infrastructure/files/services/files.service';
import { FsFilesStorage } from '@/infrastructure/files/storages/fs-files-storage';
import { FileInspector } from '@/infrastructure/files/inspectors/file-inspector';
import { AudioFileInspector } from '@/infrastructure/files/inspectors/audio.file-inspector';
import { VideoFileInspector } from '@/infrastructure/files/inspectors/video.file-inspector';
import { ImageFileInspector } from '@/infrastructure/files/inspectors/image.file-inspector';
import { UnknownFileInspector } from '@/infrastructure/files/inspectors/unknown.file-inspector';
import { FilesLocation } from '@/infrastructure/files/locations/files-location';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { FsDatabaseFile } from '@/infrastructure/fs-database-file';
import type { Post } from './entities/post.entity';
import { appConfig } from '@/config/app-config';

export class PostsModule extends Module {
  constructor() {
    const uploadsPath = appConfig.uploadsPath;

    const filesLocation = new FilesLocation({ fs: uploadsPath, src: '/uploads' });

    const fsDatabaseFile = new FsDatabaseFile<Post>({ fileName: 'posts.json' });

    const postsRepo = new PostsFsDatabaseRepo({ fsDatabaseFile });

    const filesStorage = new FsFilesStorage({ filesLocation });

    const audioFileInspector = new AudioFileInspector({ filesStorage });
    const videoFileInspector = new VideoFileInspector({ filesStorage });
    const imageFileInspector = new ImageFileInspector({ filesStorage });
    const unknownFileInspector = new UnknownFileInspector({ filesStorage });

    const fileInspector = new FileInspector({
      fileInspectors: {
        audioFileInspector,
        videoFileInspector,
        imageFileInspector,
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

    const postsService = new PostsService({ postsRepo, filesService });

    const postsController = new PostsController({ postsService });

    super({ controller: postsController });
  }
}
