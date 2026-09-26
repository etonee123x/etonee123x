import { Controller } from '@/shared/controller';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { oneTimeTokenSecretAuth } from '../middlewares/one-time-token-secret.middleware';
import type { OneTimeTokenService } from '../services/one-time-token.service';

export class OneTimeTokenController extends Controller {
  private readonly oneTimeTokenService: OneTimeTokenService;

  private createOneTimeToken: RequestHandlerTyped<'/one-time-token', 'post'> = async (...[, response]) => {
    const token = await this.oneTimeTokenService.create();

    return response.send({ token });
  };

  /**
   * Mounts the token endpoint with its configured shared secret.
   */
  constructor(parameters: { oneTimeTokenService: OneTimeTokenService; secret: string }) {
    super();

    this.oneTimeTokenService = parameters.oneTimeTokenService;

    this.router.post('/one-time-token', oneTimeTokenSecretAuth(parameters.secret), this.createOneTimeToken);
  }
}
