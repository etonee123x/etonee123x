import { queryOptions } from '@tanstack/react-query';
import { getFolderData } from '../api/get-folder-data';

export const getFolderDataQueryOptions = (path: string) => {
  return queryOptions({
    queryKey: ['folder-data', path] as const,
    queryFn: async (context) => {
      return getFolderData({ path: context.queryKey[1] });
    },
  });
};
