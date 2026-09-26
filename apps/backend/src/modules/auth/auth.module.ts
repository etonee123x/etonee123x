import Express from 'express';
import { OneTimeTokenService } from '@/modules/one-time-token/services/one-time-token.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

export class AuthModule {
  private authController: AuthController;

  /**
   * Builds auth with the one-time-token service needed for token exchange.
   */
  constructor(parameters: { oneTimeTokenService: OneTimeTokenService }) {
    const authService = new AuthService({ oneTimeTokenService: parameters.oneTimeTokenService });

    this.authController = new AuthController({ authService });
  }

  init(router: Express.Router) {
    router.use(this.authController.router);
  }
}
