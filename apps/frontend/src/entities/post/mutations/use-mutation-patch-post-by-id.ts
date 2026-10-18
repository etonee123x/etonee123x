import {
  useMutation,
  // useQueryClient
} from '@tanstack/react-query';
import { patchPostById } from '../api/patch-post-by-id';

export const useMutationPatchPostById = () => {
  return useMutation<
    Awaited<ReturnType<typeof patchPostById>>,
    Error,
    {
      id: Parameters<typeof patchPostById>[0];
      data: Parameters<typeof patchPostById>[1];
      files: Parameters<typeof patchPostById>[2];
    }
  >({
    mutationFn: ({ id, data, files }) => {
      return patchPostById(id, data, files);
    },
  });
};
