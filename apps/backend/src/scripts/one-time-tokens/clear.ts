import 'dotenv/config';

import { OneTimeTokenModule } from '@/modules/one-time-token/one-time-token.module';
import { logger } from '@/shared/logger';

const removedCount = await new OneTimeTokenModule().oneTimeTokenService.clearAll();

logger.log(`One-time tokens cleared: ${removedCount} records.`);
