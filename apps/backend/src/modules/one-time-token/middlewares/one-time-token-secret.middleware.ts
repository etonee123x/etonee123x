import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { AppError } from '@/shared/errors/app.error';

/**
Compares the shared secret without leaking matching prefixes through timing.
*/
const isSecretMatch = (providedSecret: string | undefined, expectedSecret: string): boolean => {
  if (providedSecret === undefined) {
    return false;
  }

  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
};

/**
Requires a matching x-secret header before the one-time-token handler runs.
*/
export const oneTimeTokenSecretAuth = (secret: string): RequestHandler => {
  return (...[request, , next]) => {
    if (!isSecretMatch(request.get('x-secret'), secret)) {
      next(new AppError(401));
      return;
    }

    next();
  };
};
