import jsonWebToken from 'jsonwebtoken';
import type Express from 'express';
import { appConfig } from '@/config/app-config';
import type { OneTimeTokenService } from '@/modules/one-time-token/services/one-time-token.service';
import { JWT_COOKIE_OPTIONS } from '../constants/jwt-cookie.constant';

export class AuthService {
  static readonly cookieOptions: Express.CookieOptions = JWT_COOKIE_OPTIONS;
  private readonly oneTimeTokenService: OneTimeTokenService;

  /**
   * Receives the shared one-time-token service used to redeem login tokens.
   */
  constructor(parameters: { oneTimeTokenService: OneTimeTokenService }) {
    this.oneTimeTokenService = parameters.oneTimeTokenService;
  }

  async login(parameters: { ott: string }): Promise<{ jwt: string; expires: Date }> {
    await this.oneTimeTokenService.consume({ token: parameters.ott });

    const { secretKey, authTokenMaxLifetimeMinutes } = appConfig;
    const issuedAt = Math.floor(Date.now() / 1000);
    const lifetimeSeconds = authTokenMaxLifetimeMinutes * 60;
    const jwt = jsonWebToken.sign({ isAdmin: true, iat: issuedAt }, secretKey, { expiresIn: lifetimeSeconds });

    return {
      jwt,
      expires: new Date((issuedAt + lifetimeSeconds) * 1000),
    };
  }
}
