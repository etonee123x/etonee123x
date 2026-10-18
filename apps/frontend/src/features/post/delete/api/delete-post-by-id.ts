import { updateTag } from 'next/cache';
import { client } from '@/shared/api/client';
import { getAuthHeaders } from '@/shared/api/get-auth-headers';
import type { components } from '@/shared/api/openapi';

/** Delete through Express authorization, then immediately expire the server's post cache. */
export const deletePostById = async (id: components['schemas']['PostResponse']['_meta']['id']) => {
  const response = await client['/posts/{id}'].DELETE({
    headers: await getAuthHeaders(),
    params: {
      path: { id },
    },
  });

  if (response.data) {
    updateTag('posts');
    return response.data;
  }

  throw new Error(response.error.message);
};
