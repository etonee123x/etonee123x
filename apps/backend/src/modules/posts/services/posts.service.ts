import { randomUUID } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import { nonNullable } from '@/utils/non-nullable';
import type { PostsRepo } from '../repos/posts.repo';
import type { CursorPage } from '@/shared/types/cursor-page';
import type { Post } from '../entities/post.entity';
import type { FilesService } from '@/infrastructure/files/services/files.service';
import { AppError } from '@/shared/errors/app.error';
import type { StoredFile } from '@/shared/domain/stored-file/stored-file';

export class PostsService {
  private readonly postsRepo: PostsRepo;
  private readonly filesService: FilesService;

  constructor(parameters: { postsRepo: PostsRepo; filesService: FilesService }) {
    this.postsRepo = parameters.postsRepo;
    this.filesService = parameters.filesService;
  }

  private async getKeyByFile(file: Express.Multer.File) {
    const fileType = await fileTypeFromBuffer(file.buffer);
    return [randomUUID(), ...(fileType ? [fileType.ext] : [])].join('.');
  }

  /**
   * Returns all posts or paginated slice based on pageSize and cursor parameters.
   */
  async getPosts(parameters: {
    cursorPrevious: string | null;
    cursorNext: string | null;
    postId: string | null;
    pageSize: number | null;
  }): Promise<CursorPage<Post>> {
    const pageSize = parameters.pageSize ?? 10;

    if (parameters.postId) {
      const posts = await this.postsRepo.findPostsAroundPostId({
        postId: parameters.postId,
        pageSize,
      });
      if (!posts) {
        throw new AppError(404, 'Posts was not found');
      }

      return posts;
    }

    if (parameters.cursorPrevious) {
      const posts = await this.postsRepo.findPostsByCursorPrevious({
        cursorPrevious: parameters.cursorPrevious,
        pageSize,
      });
      if (!posts) {
        throw new AppError(404, 'Posts was not found');
      }

      return posts;
    }

    if (parameters.cursorNext) {
      const posts = await this.postsRepo.findPostsByCursorNext({
        cursorNext: parameters.cursorNext,
        pageSize,
      });
      if (!posts) {
        throw new AppError(404, 'Posts was not found');
      }

      return posts;
    }

    if (parameters.pageSize === null) {
      return this.postsRepo.findAllPosts();
    }

    return this.postsRepo.findFirstPosts({ pageSize: parameters.pageSize });
  }

  async createPost(parameters: { text: string; files: Array<globalThis.Express.Multer.File> }): Promise<Post> {
    const uploadedAttachments: Array<StoredFile> = [];

    try {
      for (const file of parameters.files) {
        const uploaded = await this.filesService.upload({
          buffer: file.buffer,
          key: await this.getKeyByFile(file),
        });
        uploadedAttachments.push(uploaded);
      }

      return await this.postsRepo.createPost({
        attachments: uploadedAttachments,
        text: parameters.text,
      });
    } catch (error) {
      await Promise.all(
        uploadedAttachments.map(async (attachment) => {
          try {
            await this.filesService.delete({ key: attachment.name });
          } catch {
            // ignore cleanup errors
          }
        }),
      );

      throw error;
    }
  }

  async updatePostById(parameters: {
    id: string;
    files: Array<globalThis.Express.Multer.File>;
    attachments: Array<StoredFile | null>;
    text: string;
  }): Promise<Post> {
    const postOld = await this.postsRepo.findPostById({ id: parameters.id });

    const newlyUploaded: Array<StoredFile> = [];
    let fileIndex = 0;

    try {
      const attachments: Array<StoredFile> = [];

      for (const attachmentInput of parameters.attachments) {
        if (attachmentInput) {
          attachments.push(attachmentInput);
        } else if (fileIndex < parameters.files.length) {
          const file = nonNullable(parameters.files[fileIndex++]);
          const uploaded = await this.filesService.upload({
            buffer: file.buffer,
            key: await this.getKeyByFile(file),
          });
          newlyUploaded.push(uploaded);
          attachments.push(uploaded);
        }
      }

      while (fileIndex < parameters.files.length) {
        const file = nonNullable(parameters.files[fileIndex++]);
        const uploaded = await this.filesService.upload({
          buffer: file.buffer,
          key: await this.getKeyByFile(file),
        });
        newlyUploaded.push(uploaded);
        attachments.push(uploaded);
      }

      const post = await this.postsRepo.updatePostById({
        id: parameters.id,
        text: parameters.text,
        attachments,
      });

      const attachmentsToDelete = postOld.attachments.filter((attachmentInOldPost) => {
        return attachments.every((attachmentInNewPost) => {
          return attachmentInNewPost.src !== attachmentInOldPost.src;
        });
      });

      await Promise.all(
        attachmentsToDelete.map(async (attachment) => {
          try {
            await this.filesService.delete({ key: attachment.name });
          } catch {
            // ignore cleanup errors
          }
        }),
      );

      return post;
    } catch (error) {
      await Promise.all(
        newlyUploaded.map(async (attachment) => {
          try {
            await this.filesService.delete({ key: attachment.name });
          } catch {
            // ignore cleanup errors
          }
        }),
      );

      throw error;
    }
  }

  async deletePostById(parameters: { id: string }): Promise<Post> {
    const post = await this.postsRepo.deletePostById({ id: parameters.id });

    await Promise.all(
      post.attachments.map(async (attachment) => {
        try {
          await this.filesService.delete({ key: attachment.name });
        } catch {
          // ignore cleanup errors
        }
      }),
    );

    return post;
  }
}
