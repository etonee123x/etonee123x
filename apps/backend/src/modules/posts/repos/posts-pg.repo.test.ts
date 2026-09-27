import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

import { PostsPgRepo } from '@/modules/posts/repos/posts-pg.repo';

describe('PostsPgRepo', () => {
  it('exposes expected repository methods', () => {
    const repo = new PostsPgRepo({ pool: {} as Pool });
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(repo));

    expect(methodNames).toEqual(
      expect.arrayContaining([
        'findFirstPosts',
        'findPostsAroundPostSlug',
        'findPostsByCursorPrevious',
        'findPostsByCursorNext',
        'findPostById',
        'createPost',
        'updatePostById',
        'deletePostById',
      ]),
    );
  });

  it('currently rejects operations until implementation is added', async () => {
    const repo = new PostsPgRepo({ pool: {} as Pool });

    await expect(repo.findFirstPosts({ pageSize: 10 })).rejects.toBeInstanceOf(Error);
    await expect(repo.findPostsAroundPostSlug({ slug: 'post-1', pageSize: 10 })).rejects.toBeInstanceOf(Error);
    await expect(repo.findPostsByCursorPrevious({ cursorPrevious: '1', pageSize: 10 })).rejects.toBeInstanceOf(Error);
    await expect(repo.findPostsByCursorNext({ cursorNext: '1', pageSize: 10 })).rejects.toBeInstanceOf(Error);
    await expect(repo.findPostById({ id: '1' })).rejects.toBeInstanceOf(Error);
    await expect(repo.createPost({ slug: 'post-x', text: 'x', attachments: [] })).rejects.toBeInstanceOf(Error);
    await expect(
      repo.updatePostById({
        id: '1',
        text: 'x',
        attachments: [],
      }),
    ).rejects.toBeInstanceOf(Error);
    await expect(repo.deletePostById({ id: '1' })).rejects.toBeInstanceOf(Error);
  });
});
