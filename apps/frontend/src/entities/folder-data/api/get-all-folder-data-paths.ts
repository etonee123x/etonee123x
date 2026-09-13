import { client } from '@/shared/api/client';
import { throwError } from '@/shared/utils/throw-error';

export const getAllFolderDataPaths = async () => {
  const response = await client['/folder-data/all-paths'].GET();

  return response.data ?? throwError('Failed to load folder data paths');
};
