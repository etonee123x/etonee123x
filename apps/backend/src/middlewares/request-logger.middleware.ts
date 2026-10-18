import type { RequestHandler } from 'express';
import { logger } from '@/shared/logger';

/**
Logs the HTTP method and pathname without query parameters or request data.
*/
export const requestLogger: RequestHandler = (...[request, response, next]) => {
  const startedAt = Date.now();

  response.on('finish', () => {
    logger.info(`${new Date().toISOString()}: ${request.method} ${request.path} (${Date.now() - startedAt}ms)`);
  });

  next();
};
