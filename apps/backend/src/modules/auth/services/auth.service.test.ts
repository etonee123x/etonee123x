import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '@/shared/errors/app.error';
import { OneTimeTokenService } from '@/modules/one-time-token/services/one-time-token.service';
import { AuthService } from './auth.service';

/**
Builds auth service with an OTT record timestamp for exchange tests.
*/
const createAuthService = (createdAt: number | null) => {
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

  return new AuthService({ oneTimeTokenService });
};

describe('AuthService', () => {
  const previousSecretKey = process.env.SECRET_KEY;
  const previousMaxLifetime = process.env.AUTH_TOKEN_MAX_LIFETIME_MS;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
    process.env.AUTH_TOKEN_MAX_LIFETIME_MS = '600000';
  });

  afterEach(() => {
    process.env.SECRET_KEY = previousSecretKey;
    process.env.AUTH_TOKEN_MAX_LIFETIME_MS = previousMaxLifetime;
  });

  it('exchanges a valid OTT for a short-lived admin JWT', async () => {
    const service = createAuthService(Date.now());
    const result = await service.login({ ott: 'valid-ott' });
    const [header, payload] = result.jwt.split('.').slice(0, 2);
    const decodedPayload = JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()) as {
      exp: number;
      iat: number;
      isAdmin: boolean;
    };

    expect(header).toBeTruthy();
    expect(result.expires).toBeInstanceOf(Date);
    expect(decodedPayload.isAdmin).toBe(true);
    expect(decodedPayload.exp - decodedPayload.iat).toBe(10 * 60);
  });

  it('rejects a missing, expired, or already consumed OTT', async () => {
    await expect(createAuthService(null).login({ ott: 'used-ott' })).rejects.toBeInstanceOf(AppError);
    await expect(createAuthService(Date.now() - 60_000).login({ ott: 'expired-ott' })).rejects.toBeInstanceOf(AppError);
  });
});
