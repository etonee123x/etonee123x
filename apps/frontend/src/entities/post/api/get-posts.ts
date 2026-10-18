import { client } from '@/shared/api/client';
import type { operations } from '@/shared/api/openapi';

export const getPosts = async (query?: operations['getPosts']['parameters']['query']) => {
  const response = await client['/posts'].GET({
    params: { query },
    // Cache each URL (including filters and pagination) on the server; native browser fetch ignores next.
    next: { revalidate: 60, tags: ['posts'] },
  });

  if (response.data) {
    return response.data;
  }

  throw new Error(response.error.message);
};
