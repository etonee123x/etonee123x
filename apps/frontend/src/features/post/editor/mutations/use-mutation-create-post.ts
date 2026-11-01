import { useMutation } from '@tanstack/react-query';
import { createPost } from '../api/create-post';

export const useMutationCreatePost = () => {
  return useMutation<
    Awaited<ReturnType<typeof createPost>>,
    Error,
    {
      data: Parameters<typeof createPost>[0];
      files: Parameters<typeof createPost>[1];
    }
  >({
    mutationFn: ({ data, files }) => {
      return createPost(data, files);
    },
  });
};
