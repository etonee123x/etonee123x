import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/errors/app.error';
import { OneTimeTokenService } from './one-time-token.service';

/**
Asserts that a token record with the supplied timestamp cannot be consumed.
*/
const expectRejectedConsume = async (createdAt: number | null) => {
  const service = new OneTimeTokenService({
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

  await expect(service.consume({ token: 'one-time-token' })).rejects.toBeInstanceOf(AppError);
};

describe('OneTimeTokenService', () => {
  it('persists only a SHA-256 digest and returns the original token', async () => {
    let persistedHash = '';
    const service = new OneTimeTokenService({
      oneTimeTokenRepo: {
        create: async ({ tokenHash }) => {
          persistedHash = tokenHash;
        },
        consume: async () => {
          return null;
        },
        clearAll: async () => {
          return 0;
        },
      },
    });

    const token = await service.create();

    expect(token).toMatch(/^[\w-]{43}$/);
    expect(persistedHash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(persistedHash).not.toBe(token);
  });

  it('consumes the token hash when its creation time is less than one minute old', async () => {
    const token = 'one-time-token';
    let consumedHash = '';
    const service = new OneTimeTokenService({
      oneTimeTokenRepo: {
        create: async () => {},
        consume: async ({ tokenHash }) => {
          consumedHash = tokenHash;
          return Date.now() - 1000;
        },
        clearAll: async () => {
          return 0;
        },
      },
    });

    await expect(service.consume({ token })).resolves.toBeUndefined();
    expect(consumedHash).toBe(createHash('sha256').update(token).digest('hex'));
  });

  it('rejects missing, expired, or future-dated token records', async () => {
    await expectRejectedConsume(null);
    await expectRejectedConsume(Date.now() - 60_000);
    await expectRejectedConsume(Date.now() + 1000);
  });

  it('clears tokens through the repository', async () => {
    const service = new OneTimeTokenService({
      oneTimeTokenRepo: {
        create: async () => {},
        consume: async () => {
          return null;
        },
        clearAll: async () => {
          return 3;
        },
      },
    });

    await expect(service.clearAll()).resolves.toBe(3);
  });
});
