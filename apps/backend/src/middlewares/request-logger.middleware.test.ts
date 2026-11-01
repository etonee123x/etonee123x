import Express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestLogger } from './request-logger.middleware';
import { logger } from '@/shared/logger';

describe('requestLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs method, pathname, and duration without query parameters', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const app = Express();

    app.use(requestLogger);
    app.get('/posts', (...[, response]) => {
      response.sendStatus(200);
    });

    await request(app).get('/posts?token=secret').expect(200);
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d\d-\d\dT.*Z: GET \/posts \(\d+ms\)$/));
  });
});
