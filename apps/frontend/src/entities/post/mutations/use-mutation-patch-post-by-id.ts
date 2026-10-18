import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchPostById } from '../api/patch-post-by-id';
import { infiniteQueryKeyGetPosts } from '../queries/use-query-posts';

export const useMutationPatchPostById = () => {
  const queryClient = useQueryClient();

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
    // Server tag invalidation does not refresh the independently cached browser queries.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: infiniteQueryKeyGetPosts });
    },
  });
};
