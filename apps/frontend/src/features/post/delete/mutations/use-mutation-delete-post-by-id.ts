import { useMutation } from '@tanstack/react-query';
import { deletePostById } from '../api/delete-post-by-id';

export const useMutationDeletePostById = () => {
  return useMutation<Awaited<ReturnType<typeof deletePostById>>, Error, Parameters<typeof deletePostById>[0]>({
    mutationFn: (id) => {
      return deletePostById(id);
    },
  });
};
