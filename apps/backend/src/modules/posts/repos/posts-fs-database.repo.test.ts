import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { appConfig } from '@/config/app-config';
import { FsDatabaseFile } from '@/infrastructure/fs-database-file';
import { PostsFsDatabaseRepo } from '@/modules/posts/repos/posts-fs-database.repo';
import type { Post } from '@/modules/posts/entities/post.entity';

const buildPost = (id: string, createdAt: number): Post => {
  return {
    _meta: {
      id,
      createdAt,
      updatedAt: createdAt,
    },
    slug: `post-${createdAt}`,
    text: `post-${id}`,
    attachments: [],
  };
};

describe('PostsFsDatabaseRepo', () => {
  let databaseDirectory: string | undefined;
  const previousDatabasePath = appConfig.databasePath;

  afterEach(async () => {
    (appConfig as unknown as { databasePath: string }).databasePath = previousDatabasePath;

    if (databaseDirectory) {
      await fs.rm(databaseDirectory, { recursive: true, force: true });
      databaseDirectory = undefined;
    }
  });

  it('preserves createdAt when a post is updated', async () => {
    databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'posts-repo-'));
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    const fsDatabaseFile = new FsDatabaseFile<Omit<Post, '_meta'>>({ fileName: 'posts.json' });
    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile });
    const createdPost = await repo.createPost({ slug: 'post-1', text: 'original', attachments: [] });

    await repo.updatePostById({ id: createdPost._meta.id, text: 'updated', attachments: [] });

    const persistedPost = await repo.findPostById({ id: createdPost._meta.id });

    // Editing post content must not change its original publication timestamp.
    expect(persistedPost._meta.createdAt).toBe(createdPost._meta.createdAt);
    expect(persistedPost.text).toBe('updated');
  });

  it('findAllPosts returns all rows with null cursors', async () => {
    const posts = [buildPost('1', 500), buildPost('2', 400), buildPost('3', 300)];
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue(posts),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    const page = await repo.findAllPosts();

    expect(page.rows).toEqual(posts);
    expect(page._meta).toEqual({ total: 3, cursorPrevious: null, cursorNext: null });
  });

  it('findFirstPosts returns first page and next cursor', async () => {
    const posts = [buildPost('1', 500), buildPost('2', 400), buildPost('3', 300)];
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue(posts),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    const page = await repo.findFirstPosts({ pageSize: 2 });

    expect(fsDatabaseFile.read).toHaveBeenCalledOnce();
    expect(
      page.rows.map((post) => {
        return post._meta.id;
      }),
    ).toEqual(['1', '2']);
    expect(page._meta).toEqual({ total: 3, cursorPrevious: null, cursorNext: 300 });
  });

  it('findPostsAroundPostSlug returns rows around target post', async () => {
    const posts = [
      buildPost('1', 500),
      buildPost('2', 400),
      buildPost('3', 300),
      buildPost('4', 200),
      buildPost('5', 100),
    ];
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue(posts),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    const page = await repo.findPostsAroundPostSlug({ slug: 'post-300', pageSize: 2 });

    expect(page).not.toBeNull();
    expect(
      page?.rows.map((post) => {
        return post._meta.id;
      }),
    ).toEqual(['1', '2', '3', '4']);
    expect(page?._meta).toEqual({ total: 5, cursorPrevious: null, cursorNext: 100 });
  });

  it('findPostsAroundPostSlug returns null when post is not found', async () => {
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue([buildPost('1', 500)]),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    await expect(repo.findPostsAroundPostSlug({ slug: 'missing', pageSize: 2 })).resolves.toBeNull();
  });

  it('findPostsByCursorPrevious returns backward page', async () => {
    const posts = [
      buildPost('1', 500),
      buildPost('2', 400),
      buildPost('3', 300),
      buildPost('4', 200),
      buildPost('5', 100),
    ];
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue(posts),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    const page = await repo.findPostsByCursorPrevious({ cursorPrevious: '300', pageSize: 2 });

    expect(page).not.toBeNull();
    expect(
      page?.rows.map((post) => {
        return post._meta.id;
      }),
    ).toEqual(['2', '3']);
    expect(page?._meta).toEqual({ total: 5, cursorPrevious: 500, cursorNext: 200 });
  });

  it('findPostsByCursorPrevious returns null for unknown cursor', async () => {
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue([buildPost('1', 500)]),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    await expect(repo.findPostsByCursorPrevious({ cursorPrevious: '0', pageSize: 2 })).resolves.toBeNull();
  });

  it('findPostsByCursorNext returns forward page', async () => {
    const posts = [
      buildPost('1', 500),
      buildPost('2', 400),
      buildPost('3', 300),
      buildPost('4', 200),
      buildPost('5', 100),
    ];
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue(posts),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    const page = await repo.findPostsByCursorNext({ cursorNext: '300', pageSize: 2 });

    expect(page).not.toBeNull();
    expect(
      page?.rows.map((post) => {
        return post._meta.id;
      }),
    ).toEqual(['3', '4']);
    expect(page?._meta).toEqual({ total: 5, cursorPrevious: 400, cursorNext: 100 });
  });

  it('findPostsByCursorNext returns null for unknown cursor', async () => {
    const fsDatabaseFile = {
      read: vi.fn().mockResolvedValue([buildPost('1', 500)]),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    await expect(repo.findPostsByCursorNext({ cursorNext: '0', pageSize: 2 })).resolves.toBeNull();
  });

  it('delegates CRUD helpers to fsDatabaseFile', async () => {
    const existingPost = buildPost('1', 500);
    const createdPost = buildPost('2', 400);
    const updatedPost = buildPost('1', 450);

    const fsDatabaseFile = {
      read: vi.fn(),
      readRowById: vi.fn().mockResolvedValue(existingPost),
      writeEntityOrRow: vi.fn().mockResolvedValueOnce(createdPost).mockResolvedValueOnce(updatedPost),
      deleteRowById: vi.fn().mockResolvedValue(existingPost),
    };

    const repo = new PostsFsDatabaseRepo({ fsDatabaseFile: fsDatabaseFile as never });

    await expect(repo.findPostById({ id: '1' })).resolves.toEqual(existingPost);
    await expect(repo.createPost({ slug: 'post-new', text: 'new', attachments: [] })).resolves.toEqual(createdPost);
    await expect(
      repo.updatePostById({
        id: '1',
        text: 'upd',
        attachments: [],
      }),
    ).resolves.toEqual(updatedPost);
    await expect(repo.deletePostById({ id: '1' })).resolves.toEqual(existingPost);

    expect(fsDatabaseFile.readRowById).toHaveBeenCalledWith({ id: '1' });
    expect(fsDatabaseFile.writeEntityOrRow).toHaveBeenNthCalledWith(1, undefined, {
      slug: 'post-new',
      text: 'new',
      attachments: [],
    });
    expect(fsDatabaseFile.writeEntityOrRow).toHaveBeenNthCalledWith(2, '1', {
      ...existingPost,
      text: 'upd',
      attachments: [],
    });
    expect(fsDatabaseFile.deleteRowById).toHaveBeenCalledWith({ id: '1' });
  });
});
