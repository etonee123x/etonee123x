import type Express from 'express';
import multer from 'multer';
import { AppError } from '@/shared/errors/app.error';
import { PostsService } from '../services/posts.service';

// Reject oversized declared bodies before Multer buffers multipart data in memory.
export const validatePostBodySize: Express.RequestHandler = (...[request, , next]) => {
  const contentLength = Number(request.get('content-length'));

  if (Number.isFinite(contentLength) && contentLength > PostsService.MAX_POST_BODY_SIZE_BYTES) {
    throw new AppError(413, 'Payload Too Large');
  }

  next();
};

// Reject combined new-file data before controller work; update service also counts retained attachments.
export const validateNewPostFilesSize: Express.RequestHandler = (...[request, , next]) => {
  const files = Array.isArray(request.files) ? request.files : [];
  const totalFileSize = files.reduce((total, file) => {
    return total + file.size;
  }, 0);

  if (totalFileSize > PostsService.MAX_POST_ATTACHMENTS_SIZE_BYTES) {
    throw new AppError(413, 'Payload Too Large');
  }

  next();
};

export const parseFiles = multer({
  limits: {
    fileSize: PostsService.MAX_POST_ATTACHMENTS_SIZE_BYTES,
  },
  storage: multer.memoryStorage(),
}).array('files');
