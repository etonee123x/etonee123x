export { getPosts } from './api/get-posts';
export { patchPostById } from './api/patch-post-by-id';
export { getPostDescription } from './lib/get-post-description';
export {
  useInfiniteQueryGetPosts,
  infiniteQueryOptionsGetPosts,
  infiniteQueryKeyGetPosts,
} from './queries/use-query-posts';
export { useMutationPatchPostById } from './mutations/use-mutation-patch-post-by-id';
