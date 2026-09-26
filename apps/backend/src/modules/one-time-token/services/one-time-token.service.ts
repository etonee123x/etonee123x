import { createHash, randomBytes } from 'node:crypto';
import { AppError } from '@/shared/errors/app.error';
import { appConfig } from '@/config/app-config';
import type { OneTimeTokenRepo } from '../repos/one-time-token.repo';

export class OneTimeTokenService {
  private readonly oneTimeTokenRepo: OneTimeTokenRepo;

  /**
   * Receives a repository so token generation stays independent of storage details.
   */
  constructor(parameters: { oneTimeTokenRepo: OneTimeTokenRepo }) {
    this.oneTimeTokenRepo = parameters.oneTimeTokenRepo;
  }

  /**
  Uses one digest configuration for both token creation and consumption.
  */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Persists only the token digest and returns the unrepeatable token once.
   */
  async create(): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);

    await this.oneTimeTokenRepo.create({ tokenHash });

    return token;
  }

  /**
   * Consumes a token record once and rejects missing, future-dated, or expired tokens.
   */
  async consume(parameters: { token: string }): Promise<void> {
    const tokenHash = this.hashToken(parameters.token);
    const createdAt = await this.oneTimeTokenRepo.consume({ tokenHash });
    const now = Date.now();

    if (createdAt === null || createdAt > now || now - createdAt >= appConfig.oneTimeTokenTtlMs) {
      throw new AppError(401);
    }
  }

  /**
   * Removes every stored one-time token through the repository.
   */
  async clearAll(): Promise<number> {
    return this.oneTimeTokenRepo.clearAll();
  }
}
