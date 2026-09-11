import 'dotenv/config';

import { appConfig } from '@/config/app-config';
import { AudioCoverService } from '@/infrastructure/files/services/audio-cover.service';
import { logger } from '@/shared/logger';
import { formatBytes } from '@/utils/format-bytes';

// Script delegates deletion rules to the service so callers do not know filesystem details.
const result = await new AudioCoverService({ directory: appConfig.audioCoversPath }).clear();
logger.log(`Audio covers cleared: ${result.filesCount} files, ${formatBytes(result.bytes)}.`);
