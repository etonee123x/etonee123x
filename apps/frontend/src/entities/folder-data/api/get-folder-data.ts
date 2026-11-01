import type { paths } from '@/shared/api/openapi';
import { client } from '@/shared/api/client';

export const getFolderData = async (query: NonNullable<paths['/folder-data']['get']['parameters']['query']>) => {
  const response = await client['/folder-data'].GET({
    params: {
      query: {
        ...query,
        path: query.path && decodeURIComponent(query.path),
      },
    },
    // Keep folder results separate by their full URL without changing browser HTTP caching.
    next: { revalidate: 60, tags: ['folder-data'] },
  });

  if (response.data) {
    return response.data;
  }

  throw new Error(response.error.message);
};
