/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CursorPage } from '@/shared/types/cursor-page';
import type { Post } from '../entities/post.entity';
import { PgRepo } from '@/infrastructure/database/pg.repo';
import type { StoredFile } from '@/shared/domain/stored-file/stored-file';
import type { PostsRepo } from './posts.repo';

export class PostsPgRepo extends PgRepo implements PostsRepo {
  async findAllPosts(): Promise<CursorPage<Post>> {
    throw new Error('Not implemented');
  }

  async findFirstPosts(parameters: { pageSize: number }): Promise<CursorPage<Post>> {
    throw new Error('Not implemented');
  }

  async findPostsAroundPostId(parameters: { postId: string; pageSize: number }): Promise<CursorPage<Post> | null> {
    throw new Error('Not implemented');
  }

  async findPostsByCursorPrevious(parameters: {
    cursorPrevious: string;
    pageSize: number;
  }): Promise<CursorPage<Post> | null> {
    throw new Error('Not implemented');
  }

  async findPostsByCursorNext(parameters: { cursorNext: string; pageSize: number }): Promise<CursorPage<Post> | null> {
    throw new Error('Not implemented');
  }

  async findPostById(parameters: { id: string }): Promise<Post> {
    throw new Error('Not implemented');
  }

  async createPost(parameters: { text: string; attachments: Array<StoredFile> }): Promise<Post> {
    throw new Error('Not implemented');
  }

  async updatePostById(parameters: { id: string; text: string; attachments: Array<StoredFile> }): Promise<Post> {
    throw new Error('Not implemented');
  }

  async deletePostById(parameters: { id: string }): Promise<Post> {
    throw new Error('Not implemented');
  }
}
