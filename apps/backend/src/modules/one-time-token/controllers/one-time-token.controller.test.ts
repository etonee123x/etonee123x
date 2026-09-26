import Express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '@/middlewares/error-handler.middleware';
import { OneTimeTokenController } from './one-time-token.controller';
import { OneTimeTokenService } from '../services/one-time-token.service';

/**
Builds an isolated Express app around the one-time-token route.
*/
const buildApp = (oneTimeTokenService: OneTimeTokenService) => {
  const app = Express();
  const oneTimeTokenController = new OneTimeTokenController({
    oneTimeTokenService,
    secret: 'test-secret',
  });

  app.use(oneTimeTokenController.router);
  app.use(errorHandler);

  return app;
};

const buildOneTimeTokenService = () => {
  const oneTimeTokenService = new OneTimeTokenService({
    oneTimeTokenRepo: {
      create: () => {
        return Promise.resolve();
      },
      consume: async () => {
        return null;
      },
      clearAll: async () => {
        return 0;
      },
    },
  });

  return {
    oneTimeTokenService,
    createToken: vi.spyOn(oneTimeTokenService, 'create').mockResolvedValue('generated-token'),
  };
};

describe('OneTimeTokenController', () => {
  it.each([undefined, 'wrong-secret'])('rejects a missing or invalid x-secret', async (secret) => {
    const { oneTimeTokenService, createToken } = buildOneTimeTokenService();
    const testRequest = request(buildApp(oneTimeTokenService)).post('/one-time-token');

    if (secret !== undefined) {
      testRequest.set('x-secret', secret);
    }

    const response = await testRequest.expect(401);

    expect(response.body).toMatchObject({ statusCode: 401 });
    expect(createToken).not.toHaveBeenCalled();
  });

  it('returns the generated token after valid x-secret authentication', async () => {
    const { oneTimeTokenService, createToken } = buildOneTimeTokenService();

    const response = await request(buildApp(oneTimeTokenService))
      .post('/one-time-token')
      .set('x-secret', 'test-secret')
      .expect(200);

    expect(response.body).toEqual({ token: 'generated-token' });
    expect(createToken).toHaveBeenCalledOnce();
  });
});
