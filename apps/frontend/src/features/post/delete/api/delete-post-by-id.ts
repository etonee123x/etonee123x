import { client } from '@/shared/api/client';
import type { components } from '@/shared/api/openapi';

/** Delete through Express authorization, then immediately expire the server's post cache. */
export const deletePostById = async (id: components['schemas']['PostResponse']['_meta']['id']) => {
  const response = await client['/posts/{id}'].DELETE({
    params: {
      path: { id },
    },
  });

  if (response.data) {
    return response.data;
  }

  throw new Error(response.error.message);
};
