import Express from 'express';
import cookieParser from 'cookie-parser';
import jsonWebToken from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { KEY_COOKIE_JWT } from '@/constants/key-cookie-jwt';
import { errorHandler } from '@/middlewares/error-handler.middleware';
import { AppError } from '@/shared/errors/app.error';
import { PostsController } from '@/modules/posts/controllers/posts.controller';

const buildApp = (postsService: unknown) => {
  const app = Express();

  app.use(cookieParser());
  app.use(Express.json());

  const controller = new PostsController({ postsService: postsService as never });
  app.use(controller.router);
  app.use(errorHandler);

  return app;
};

const signJwt = () => {
  return jsonWebToken.sign({ role: 'admin' }, String(process.env.SECRET_KEY), { expiresIn: '1h' });
};

describe('PostsController', () => {
  const previousSecretKey = process.env.SECRET_KEY;

  beforeEach(() => {
    process.env.SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.SECRET_KEY = previousSecretKey;
  });

  it('maps query params and calls getPosts service', async () => {
    const getPosts = vi.fn(async () => {
      return {
        _meta: { cursorPrevious: null, cursorNext: null },
        rows: [],
      };
    });

    const app = buildApp({
      getPosts,
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app)
      .get('/posts?pageSize=3&filters[cursorPrevious]=200&filters[cursorNext]=100&filters[postId]=post-1')
      .expect(200);

    expect(getPosts).toHaveBeenCalledWith({
      pageSize: 3,
      cursorPrevious: '200',
      cursorNext: '100',
      postId: 'post-1',
    });
  });

  it('uses default pageSize when query is absent', async () => {
    const getPosts = vi.fn(async () => {
      return {
        _meta: { cursorPrevious: null, cursorNext: null },
        rows: [],
      };
    });

    const app = buildApp({
      getPosts,
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app).get('/posts').expect(200);

    expect(getPosts).toHaveBeenCalledWith({
      pageSize: 10,
      cursorPrevious: null,
      cursorNext: null,
      postId: null,
    });
  });

  it('calls createPost with parsed body and files', async () => {
    const createPost = vi.fn(async () => {
      return { ok: true };
    });
    const jwt = signJwt();

    const app = buildApp({
      getPosts: vi.fn(),
      createPost,
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app)
      .post('/posts')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .field('text', 'hello')
      .attach('files', Buffer.from('content'), { filename: 'upload.bin', contentType: 'application/octet-stream' })
      .expect(200);

    expect(createPost).toHaveBeenCalledWith({
      text: 'hello',
      files: [
        expect.objectContaining({
          originalname: 'upload.bin',
        }),
      ],
    });
  });

  it('calls updatePostById with id, text, attachments and files', async () => {
    const updatePostById = vi.fn(async () => {
      return { ok: true };
    });
    const jwt = signJwt();

    const app = buildApp({
      getPosts: vi.fn(),
      createPost: vi.fn(),
      updatePostById,
      deletePostById: vi.fn(),
    });

    const attachments = [{ src: '/uploads/file.png', name: 'file.png' }];

    await request(app)
      .patch('/posts/post-7')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .field('text', 'updated')
      .field('attachments', JSON.stringify(attachments))
      .attach('files', Buffer.from('content'), { filename: 'upload.bin', contentType: 'application/octet-stream' })
      .expect(200);

    expect(updatePostById).toHaveBeenCalledWith({
      id: 'post-7',
      text: 'updated',
      attachments,
      files: [
        expect.objectContaining({
          originalname: 'upload.bin',
        }),
      ],
    });
  });

  it('calls deletePostById with route param id', async () => {
    const deletePostById = vi.fn(async () => {
      return { ok: true };
    });
    const jwt = signJwt();

    const app = buildApp({
      getPosts: vi.fn(),
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById,
    });

    await request(app)
      .delete('/posts/post-9')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .expect(200);

    expect(deletePostById).toHaveBeenCalledWith({ id: 'post-9' });
  });

  it('returns app error status when service throws AppError', async () => {
    const app = buildApp({
      getPosts: vi.fn(async () => {
        throw new AppError(404, 'Posts was not found');
      }),
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    const response = await request(app).get('/posts?filters[postId]=missing&pageSize=3').expect(404);

    expect(response.body).toMatchObject({ statusCode: 404 });
  });

  it('accepts empty text when creating a post', async () => {
    const createPost = vi.fn(async () => {
      return { ok: true };
    });
    const jwt = signJwt();

    const app = buildApp({
      getPosts: vi.fn(),
      createPost,
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app)
      .post('/posts')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .field('text', '')
      .expect(200);

    expect(createPost).toHaveBeenCalledWith({
      text: '',
      files: [],
    });
  });

  it('rejects invalid pageSize query parameter with 400', async () => {
    const app = buildApp({
      getPosts: vi.fn(),
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app).get('/posts?pageSize=999').expect(400);
    await request(app).get('/posts?pageSize=invalid').expect(400);
  });

  it('rejects malformed attachments json in updatePostById with 400', async () => {
    const jwt = signJwt();
    const app = buildApp({
      getPosts: vi.fn(),
      createPost: vi.fn(),
      updatePostById: vi.fn(),
      deletePostById: vi.fn(),
    });

    await request(app)
      .patch('/posts/post-1')
      .set('Cookie', [`${KEY_COOKIE_JWT}=${jwt}`])
      .field('text', 'updated')
      .field('attachments', '{broken-json')
      .expect(400);
  });
});
