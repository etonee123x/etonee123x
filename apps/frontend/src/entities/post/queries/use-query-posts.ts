import { infiniteQueryOptions, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { getPosts } from '../api/get-posts';
import type { components } from '@/shared/api/openapi';
import { isNil } from '@/shared/utils/is-nil';

export const infiniteQueryKeyGetPosts = ['posts'] as const;

export const infiniteQueryOptionsGetPosts = (
  selectedPostSlug: components['schemas']['PostResponse']['slug'] | null,
) => {
  return infiniteQueryOptions<
    Awaited<ReturnType<typeof getPosts>>,
    Error,
    InfiniteData<Awaited<ReturnType<typeof getPosts>>>,
    typeof infiniteQueryKeyGetPosts,
    Parameters<typeof getPosts>[0]
  >({
    queryKey: infiniteQueryKeyGetPosts,
    queryFn: (context) => {
      return getPosts(context.pageParam);
    },

    getPreviousPageParam: (firstPage): Parameters<typeof getPosts>[0] => {
      return firstPage._meta.cursorPrevious
        ? {
            filters: {
              cursorPrevious: firstPage._meta.cursorPrevious,
            },
          }
        : undefined;
    },
    getNextPageParam: (lastPage): Parameters<typeof getPosts>[0] => {
      return lastPage._meta.cursorNext
        ? {
            filters: {
              cursorNext: lastPage._meta.cursorNext,
            },
          }
        : undefined;
    },
    initialPageParam: isNil(selectedPostSlug)
      ? {}
      : {
          filters: {
            slug: selectedPostSlug,
          },
        },
  });
};

export const useInfiniteQueryGetPosts = (...parameters: Parameters<typeof infiniteQueryOptionsGetPosts>) => {
  return useInfiniteQuery(infiniteQueryOptionsGetPosts(...parameters));
};
