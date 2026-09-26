import { cookieAuth } from '@/middlewares/cookie-auth.middleware';
import { rateLimit } from 'express-rate-limit';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { KEY_COOKIE_JWT } from '@/constants/key-cookie-jwt';
import { AppError } from '@/shared/errors/app.error';
import { Controller } from '@/shared/controller';
import { AuthService } from '../services/auth.service';

export class AuthController extends Controller {
  private readonly authService: AuthService;

  /**
  Exchanges the required OTT query value for an auth cookie.
  */
  private login: RequestHandlerTyped<'/auth', 'post'> = async (request, response) => {
    const ott = request.query.ott;

    if (!ott) {
      throw new AppError(400, 'OTT is not found in request query');
    }

    const { jwt, expires } = await this.authService.login({ ott });

    response.cookie(KEY_COOKIE_JWT, jwt, { ...AuthService.cookieOptions, expires });

    return response.send({ jwt });
  };

  private logout: RequestHandlerTyped<'/auth', 'delete'> = (...[, response]) => {
    response.clearCookie(KEY_COOKIE_JWT, AuthService.cookieOptions);

    return response.send({ jwt: null });
  };

  constructor(parameters: { authService: AuthService }) {
    super();

    this.authService = parameters.authService;

    this.router.post(
      '/auth',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
      }),
      this.login,
    );
    this.router.delete('/auth', cookieAuth, this.logout);
  }
}
