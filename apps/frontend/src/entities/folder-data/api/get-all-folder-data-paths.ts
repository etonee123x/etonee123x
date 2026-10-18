import { client } from '@/shared/api/client';
import { throwError } from '@/shared/utils/throw-error';

export const getAllFolderDataPaths = async () => {
  // Refresh the server's sitemap path inventory independently of individual folder responses.
  const response = await client['/folder-data/all-paths'].GET({
    next: { revalidate: 60, tags: ['folder-data-paths'] },
  });

  return response.data ?? throwError('Failed to load folder data paths');
};
