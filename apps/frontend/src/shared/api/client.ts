import type { paths } from '@/shared/api/openapi';
import { createPathBasedClient } from 'openapi-fetch';
import { isClient } from '@/shared/utils/target';
import { throwError } from '@/shared/utils/throw-error';

const baseUrl = (() => {
  if (isClient) {
    return '/api';
  }

  return process.env.INTERNAL_API_URL ?? process.env.SERVER_ORIGIN ?? throwError('INTERNAL_API_URL is not defined');
})();

export const client = createPathBasedClient<paths>({
  baseUrl,
  // Resolve fetch at call time so server requests use Next.js's patched fetch, including Request.next.
  fetch: (request) => {
    return fetch(request);
  },
});
