import { FsDatabaseRepo } from '@/infrastructure/database/fs-database.repo';
import type { PostsRepo } from './posts.repo';
import type { CursorPage } from '@/shared/types/cursor-page';
import type { Post } from '../entities/post.entity';
import type { StoredFile } from '@/shared/domain/stored-file/stored-file';

export class PostsFsDatabaseRepo extends FsDatabaseRepo<Omit<Post, '_meta'>, Post> implements PostsRepo {
  /**
   * Returns all posts with null cursors for consumers that bypass pagination.
   */
  async findAllPosts(): Promise<CursorPage<Post>> {
    const posts = await this.fsDatabaseFile.read();

    return {
      _meta: {
        cursorPrevious: null,
        cursorNext: null,
      },
      rows: posts,
    };
  }

  async findFirstPosts(parameters: { pageSize: number }): Promise<CursorPage<Post>> {
    const posts = await this.fsDatabaseFile.read();

    return {
      _meta: {
        cursorPrevious: null,
        cursorNext: posts[parameters.pageSize]?._meta.createdAt ?? null,
      },
      rows: posts.slice(0, parameters.pageSize),
    };
  }

  async findPostsAroundPostId(parameters: { postId: string; pageSize: number }): Promise<CursorPage<Post> | null> {
    const posts = await this.fsDatabaseFile.read();

    const index = posts.findIndex((post) => {
      return post._meta.id === parameters.postId;
    });

    if (index === -1) {
      return null;
    }

    const start = Math.max(0, index - parameters.pageSize);
    const end = Math.min(index + parameters.pageSize, posts.length);

    return {
      _meta: {
        cursorPrevious: posts[start - 1]?._meta.createdAt ?? null,
        cursorNext: posts[end]?._meta.createdAt ?? null,
      },
      rows: posts.slice(start, end),
    };
  }

  async findPostsByCursorPrevious(parameters: {
    cursorPrevious: string;
    pageSize: number;
  }): Promise<CursorPage<Post> | null> {
    const posts = await this.fsDatabaseFile.read();

    const index = posts.findIndex((post) => {
      return String(post._meta.createdAt) === parameters.cursorPrevious;
    });

    if (index === -1) {
      return null;
    }

    const indexLast = Math.min(posts.length, index + 1);
    const indexInitial = Math.max(0, indexLast - parameters.pageSize);

    return {
      _meta: {
        cursorPrevious: posts[indexInitial - 1]?._meta.createdAt ?? null,
        cursorNext: posts[indexLast]?._meta.createdAt ?? null,
      },
      rows: posts.slice(indexInitial, indexLast),
    };
  }

  async findPostsByCursorNext(parameters: { cursorNext: string; pageSize: number }): Promise<CursorPage<Post> | null> {
    const posts = await this.fsDatabaseFile.read();

    const index = posts.findIndex((post) => {
      return String(post._meta.createdAt) === parameters.cursorNext;
    });

    if (index === -1) {
      return null;
    }

    const indexInitial = index;
    const indexLast = Math.min(posts.length, indexInitial + parameters.pageSize);

    return {
      _meta: {
        cursorPrevious: posts[indexInitial - 1]?._meta.createdAt ?? null,
        cursorNext: posts[indexLast]?._meta.createdAt ?? null,
      },
      rows: posts.slice(indexInitial, indexLast),
    };
  }

  async findPostById(parameters: { id: string }): Promise<Post> {
    return this.fsDatabaseFile.readRowById(parameters);
  }

  async createPost(parameters: { text: string; attachments: Array<StoredFile> }): Promise<Post> {
    return this.fsDatabaseFile.writeEntityOrRow(undefined, parameters);
  }

  async updatePostById(parameters: { id: string; text: string; attachments: Array<StoredFile> }): Promise<Post> {
    return this.fsDatabaseFile.writeEntityOrRow(parameters.id, parameters);
  }

  async deletePostById(parameters: { id: string }): Promise<Post> {
    return this.fsDatabaseFile.deleteRowById(parameters);
  }
}
