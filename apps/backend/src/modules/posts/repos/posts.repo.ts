import type { CursorPage } from '@/shared/types/cursor-page';
import type { Post } from '../entities/post.entity';
import type { StoredFile } from '@/shared/domain/stored-file/stored-file';

export interface PostsRepo {
  /**
   * Returns all posts without pagination limits.
   */
  findAllPosts: () => Promise<CursorPage<Post>>;

  findFirstPosts: (parameters: { pageSize: number }) => Promise<CursorPage<Post>>;

  findPostsAroundPostId: (parameters: { postId: string; pageSize: number }) => Promise<CursorPage<Post> | null>;

  findPostsByCursorPrevious: (parameters: {
    cursorPrevious: string;
    pageSize: number;
  }) => Promise<CursorPage<Post> | null>;

  findPostsByCursorNext: (parameters: { cursorNext: string; pageSize: number }) => Promise<CursorPage<Post> | null>;

  findPostById: (parameters: { id: string }) => Promise<Post>;

  createPost: (parameters: { text: string; attachments: Array<StoredFile> }) => Promise<Post>;

  updatePostById: (parameters: { id: string; text: string; attachments: Array<StoredFile> }) => Promise<Post>;

  deletePostById: (parameters: { id: string }) => Promise<Post>;
}
