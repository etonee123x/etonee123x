import { rateLimit } from 'express-rate-limit';

/**
 * Limits public contact submissions to three requests per client IP per day.
 */
export const contactRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
