import { describe, expect, it, vi } from 'vitest';

vi.mock('file-type', () => {
  return {
    fileTypeFromBuffer: vi.fn(),
  };
});

import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '@/shared/errors/app.error';
import { PostsService } from '@/modules/posts/services/posts.service';

interface MockedPostsRepo {
  findAllPosts: ReturnType<typeof vi.fn>;
  findFirstPosts: ReturnType<typeof vi.fn>;
  findPostsAroundPostId: ReturnType<typeof vi.fn>;
  findPostsByCursorPrevious: ReturnType<typeof vi.fn>;
  findPostsByCursorNext: ReturnType<typeof vi.fn>;
  findPostById: ReturnType<typeof vi.fn>;
  createPost: ReturnType<typeof vi.fn>;
  updatePostById: ReturnType<typeof vi.fn>;
  deletePostById: ReturnType<typeof vi.fn>;
}

interface MockedFilesService {
  upload: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

const buildService = () => {
  const postsRepo: MockedPostsRepo = {
    findAllPosts: vi.fn(),
    findFirstPosts: vi.fn(),
    findPostsAroundPostId: vi.fn(),
    findPostsByCursorPrevious: vi.fn(),
    findPostsByCursorNext: vi.fn(),
    findPostById: vi.fn(),
    createPost: vi.fn(),
    updatePostById: vi.fn(),
    deletePostById: vi.fn(),
  };

  const filesService: MockedFilesService = {
    upload: vi.fn().mockResolvedValue({ src: '/test', name: 'test' }),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const service = new PostsService({
    postsRepo: postsRepo as never,
    filesService: filesService as never,
  });

  return { service, postsRepo, filesService };
};

const buildFile = (fileName: string, content: string) => {
  return {
    originalname: fileName,
    buffer: Buffer.from(content),
  } as Express.Multer.File;
};

describe('PostsService', () => {
  it('returns first page when no cursors or postId provided', async () => {
    const { service, postsRepo } = buildService();
    const page = {
      _meta: { cursorPrevious: null, cursorNext: null },
      rows: [],
    };

    postsRepo.findFirstPosts.mockResolvedValue(page);

    await expect(
      service.getPosts({
        postId: null,
        cursorNext: null,
        cursorPrevious: null,
        pageSize: 10,
      }),
    ).resolves.toBe(page);
  });

  it('returns all posts when getPosts is called with null pageSize', async () => {
    const { service, postsRepo } = buildService();
    const page = {
      _meta: { cursorPrevious: null, cursorNext: null },
      rows: [],
    };

    postsRepo.findAllPosts.mockResolvedValue(page);

    await expect(
      service.getPosts({
        cursorPrevious: null,
        cursorNext: null,
        postId: null,
        pageSize: null,
      }),
    ).resolves.toBe(page);
    expect(postsRepo.findAllPosts).toHaveBeenCalledOnce();
  });

  it('throws 404 when around-post query returns null', async () => {
    const { service, postsRepo } = buildService();

    postsRepo.findPostsAroundPostId.mockResolvedValue(null);

    await expect(
      service.getPosts({
        postId: 'missing',
        cursorNext: null,
        cursorPrevious: null,
        pageSize: 10,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('uses previous and next cursor branches', async () => {
    const { service, postsRepo } = buildService();
    const previousPage = {
      _meta: { cursorPrevious: 500, cursorNext: 300 },
      rows: [],
    };
    const nextPage = {
      _meta: { cursorPrevious: 300, cursorNext: 100 },
      rows: [],
    };

    postsRepo.findPostsByCursorPrevious.mockResolvedValue(previousPage);
    postsRepo.findPostsByCursorNext.mockResolvedValue(nextPage);

    await expect(
      service.getPosts({
        postId: null,
        cursorNext: null,
        cursorPrevious: '500',
        pageSize: 2,
      }),
    ).resolves.toBe(previousPage);

    await expect(
      service.getPosts({
        postId: null,
        cursorNext: '300',
        cursorPrevious: null,
        pageSize: 2,
      }),
    ).resolves.toBe(nextPage);
  });

  it('throws 404 when previous cursor query returns null', async () => {
    const { service, postsRepo } = buildService();

    postsRepo.findPostsByCursorPrevious.mockResolvedValue(null);

    await expect(
      service.getPosts({
        postId: null,
        cursorNext: null,
        cursorPrevious: '500',
        pageSize: 10,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('throws 404 when next cursor query returns null', async () => {
    const { service, postsRepo } = buildService();

    postsRepo.findPostsByCursorNext.mockResolvedValue(null);

    await expect(
      service.getPosts({
        postId: null,
        cursorNext: '300',
        cursorPrevious: null,
        pageSize: 10,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('createPost uses server-detected extensions in generated attachment keys', async () => {
    const { service, postsRepo, filesService } = buildService();

    const files = [buildFile('untrusted.exe', 'A'), buildFile('also-untrusted.exe', 'B')];
    const [fileA, fileB] = files;
    if (!fileA || !fileB) {
      throw new Error('Expected test files to exist');
    }
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ ext: 'mp3', mime: 'audio/mpeg' });
    const attachmentA = { src: '/uploads/a.mp3', name: 'uuid1.mp3' };
    const attachmentB = { src: '/uploads/b.mp3', name: 'uuid2.mp3' };

    filesService.upload.mockResolvedValueOnce(attachmentA).mockResolvedValueOnce(attachmentB);

    postsRepo.createPost.mockResolvedValue({ id: 'created' });

    await service.createPost({ text: 'post', files });

    expect(filesService.upload).toHaveBeenNthCalledWith(1, {
      key: expect.stringMatching(/^[a-f0-9-]+\.mp3$/) as never,
      buffer: fileA.buffer,
    });
    expect(filesService.upload).toHaveBeenNthCalledWith(2, {
      key: expect.stringMatching(/^[a-f0-9-]+\.mp3$/) as never,
      buffer: fileB.buffer,
    });
    expect(postsRepo.createPost).toHaveBeenCalledWith({
      text: 'post',
      attachments: [attachmentA, attachmentB],
    });
  });

  it('updatePostById uploads null slots, keeps existing, deletes removed, updates repo', async () => {
    const { service, postsRepo, filesService } = buildService();

    const oldKeep = { src: '/uploads/keep.mp3', name: 'keep.mp3' };
    const oldDrop = { src: '/uploads/drop.mp3', name: 'drop.mp3' };
    const newAttachment = { src: '/uploads/new.mp3', name: 'new.mp3' };

    postsRepo.findPostById.mockResolvedValue({
      attachments: [oldKeep, oldDrop],
    });
    filesService.upload.mockResolvedValue(newAttachment);
    postsRepo.updatePostById.mockResolvedValue({ id: 'updated' });

    const attachmentsInput = [oldKeep, null];

    await service.updatePostById({
      id: 'post-1',
      text: 'updated text',
      attachments: attachmentsInput as never,
      files: [buildFile('new.mp3', 'N')],
    });

    expect(filesService.upload).toHaveBeenCalledWith({
      key: expect.stringMatching(/^[a-f0-9-]+\.mp3$/) as never,
      buffer: Buffer.from('N'),
    });
    expect(filesService.delete).toHaveBeenCalledWith({ key: 'drop.mp3' });
    expect(postsRepo.updatePostById).toHaveBeenCalledWith({
      id: 'post-1',
      text: 'updated text',
      attachments: [oldKeep, newAttachment],
    });
  });

  it('createPost cleans up uploaded files if repo creation fails', async () => {
    const { service, postsRepo, filesService } = buildService();

    const files = [buildFile('a.mp3', 'A')];
    const uploadedAttachment = { src: '/uploads/a.mp3', name: 'uploaded-a.mp3' };

    filesService.upload.mockResolvedValue(uploadedAttachment);
    postsRepo.createPost.mockRejectedValue(new Error('db write error'));

    await expect(service.createPost({ text: 'post', files })).rejects.toThrow('db write error');

    expect(filesService.delete).toHaveBeenCalledWith({ key: 'uploaded-a.mp3' });
  });

  it('updatePostById cleans up newly uploaded files if repo update fails', async () => {
    const { service, postsRepo, filesService } = buildService();

    postsRepo.findPostById.mockResolvedValue({ attachments: [] });
    const newAttachment = { src: '/uploads/new.mp3', name: 'uploaded-new.mp3' };
    filesService.upload.mockResolvedValue(newAttachment);
    postsRepo.updatePostById.mockRejectedValue(new Error('db update error'));

    await expect(
      service.updatePostById({
        id: 'post-1',
        text: 'updated text',
        attachments: [null],
        files: [buildFile('new.mp3', 'N')],
      }),
    ).rejects.toThrow('db update error');

    expect(filesService.delete).toHaveBeenCalledWith({ key: 'uploaded-new.mp3' });
  });

  it('deletePostById deletes all attached files and returns deleted post', async () => {
    const { service, postsRepo, filesService } = buildService();

    const deletedPost = {
      _meta: { id: '1', createdAt: 1, updatedAt: 1 },
      text: 'x',
      attachments: [
        { name: 'a.mp3', src: '/uploads/a.mp3' },
        { name: 'b.mp3', src: '/uploads/b.mp3' },
      ],
    };

    postsRepo.deletePostById.mockResolvedValue(deletedPost);
    filesService.delete.mockResolvedValue(undefined);

    await expect(service.deletePostById({ id: '1' })).resolves.toBe(deletedPost);

    expect(filesService.delete).toHaveBeenNthCalledWith(1, { key: 'a.mp3' });
    expect(filesService.delete).toHaveBeenNthCalledWith(2, { key: 'b.mp3' });
  });

  it('createPost propagates upload error and does not write post', async () => {
    const { service, postsRepo, filesService } = buildService();

    filesService.upload.mockRejectedValue(new Error('upload failed'));

    await expect(
      service.createPost({
        text: 'post',
        files: [buildFile('a.mp3', 'A')],
      }),
    ).rejects.toThrow('upload failed');

    expect(postsRepo.createPost).not.toHaveBeenCalled();
  });

  it('updatePostById propagates upload error', async () => {
    const { service, postsRepo, filesService } = buildService();

    postsRepo.findPostById.mockResolvedValue({ attachments: [] });
    filesService.upload.mockRejectedValue(new Error('upload failed'));

    await expect(
      service.updatePostById({
        id: 'post-1',
        text: 'updated',
        attachments: [null],
        files: [buildFile('new.mp3', 'N')],
      }),
    ).rejects.toThrow('upload failed');

    expect(postsRepo.updatePostById).not.toHaveBeenCalled();
  });
});
