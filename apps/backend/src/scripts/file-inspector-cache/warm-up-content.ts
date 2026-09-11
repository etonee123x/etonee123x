import 'dotenv/config';

import { createFolderDataFiles } from '@/modules/folder-data/folder-data-files.factory';
import { logger } from '@/shared/logger';

// Script reuses folder-data composition; FilesService owns traversal, concurrency, inspection, and stats.
const { filesLocation, filesService } = createFolderDataFiles();
const result = await filesService.warmUpContent({ directory: filesLocation.fs });

logger.log(`File inspector warm-up overall: ${result.filesCount} warmed files.`);

for (const directoryResult of result.directories) {
  logger.log(
    `File inspector warm-up directory: ${directoryResult.directory} (${directoryResult.filesCount} warmed files).`,
  );
}
