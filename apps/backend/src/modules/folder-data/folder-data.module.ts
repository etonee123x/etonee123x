import { Module } from '@/shared/module';
import { FolderDataController } from './controllers/folder-data.controller';
import { FolderDataService } from './services/folder-data.service';
import { createFolderDataFiles } from './folder-data-files.factory';

export class FolderDataModule extends Module {
  constructor() {
    // Shared folder-data file graph keeps HTTP module and scripts on the same inspector setup.
    const { filesLocation, filesService } = createFolderDataFiles();

    const folderDataService = new FolderDataService({ filesService, filesLocation });

    const folderDataController = new FolderDataController({ folderDataService });

    super({ controller: folderDataController });
  }
}
