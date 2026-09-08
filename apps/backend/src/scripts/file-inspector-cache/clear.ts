import 'dotenv/config';

import { appConfig } from '@/config/app-config';
import { FileInspectorCacheService } from '@/infrastructure/files/services/file-inspector-cache.service';

// No cache storage means there is nothing to clear.
if (appConfig.fileInspectorCachePath) {
  await new FileInspectorCacheService({ directory: appConfig.fileInspectorCachePath }).clear();
}
