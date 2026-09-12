import 'dotenv/config';

import { appConfig } from '@/config/app-config';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';
import { logger } from '@/shared/logger';
import { formatBytes } from '@/utils/format-bytes';

// No cache storage means there is nothing to clear.
if (appConfig.fileInspectorCachePath) {
  const result = await new FileInspectorCacheService({ directory: appConfig.fileInspectorCachePath }).clear();
  logger.log(`File inspector cache cleared: ${result.filesCount} files, ${formatBytes(result.bytes)}.`);
} else {
  logger.log('File inspector cache skipped: FILE_INSPECTOR_CACHE_PATH is not configured.');
}
