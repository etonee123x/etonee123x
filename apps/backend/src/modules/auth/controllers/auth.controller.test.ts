import Express from 'express';
import cookieParser from 'cookie-parser';
import jsonWebToken from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KEY_COOKIE_JWT } from '@/constants/key-cookie-jwt';
import { errorHandler } from '@/middlewares/error-handler.middleware';
import { OneTimeTokenService } from '@/modules/one-time-token/services/one-time-token.service';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { AuthService } from '@/modules/auth/services/auth.service';

/**
Builds auth service with an inert OTT dependency for existing JWT behavior tests.
*/
const buildApp = (createdAt: number | null = Date.now()) => {
  const app = Express();

  app.use(cookieParser());

  const oneTimeTokenService = new OneTimeTokenService({
    oneTimeTokenRepo: {
      create: async () => {},
      consume: async () => {
        return createdAt;
      },
      clearAll: async () => {
        return 0;
      },
    },
  });
  const controller = new AuthController({ authService: new AuthService({ oneTimeTokenService }) });
  app.use(controller.router);
  app.use(errorHandler);

  return app;
};

const signJwt = () => {
  return jsonWebToken.sign({ role: 'admin' }, String(process.env.SECRET_KEY), { expiresIn: '5m' });
};

describe('AuthController', () => {
  const previousSecretKey = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = previousSecretKey;
  });

  it('returns 400 when ott is missing', async () => {
    const app = buildApp();

    const response = await request(app).post('/auth').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
  });

  it('returns 401 when ott is expired or already consumed', async () => {
    const app = buildApp(null);
    const response = await request(app).post('/auth').query({ ott: 'invalid-ott' }).expect(401);
    expect(response.body).toMatchObject({ statusCode: 401 });
  });

  it('exchanges ott for an auth cookie', async () => {
    const app = buildApp();

    const response = await request(app).post('/auth').query({ ott: 'valid-ott' }).expect(200);
    const { jwt } = response.body as { jwt: string };
    const payload = jsonWebToken.verify(jwt, String(process.env.SECRET_KEY));

    expect(payload).toMatchObject({ isAdmin: true });
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('clears cookie and returns null jwt on logout', async () => {
    const app = buildApp();
    const jwt = signJwt();

    const response = await request(app)
      .delete('/auth')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .expect(200);

    expect(response.body).toEqual({ jwt: null });
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
