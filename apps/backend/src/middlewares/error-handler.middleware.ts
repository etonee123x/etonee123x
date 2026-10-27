import { AppError } from '@/shared/errors/app.error';
import { logger } from '@/shared/logger';
import { sanitizeUrl } from '@/utils/sanitize-url';
import multer from 'multer';
import type { ErrorRequestHandler } from 'express';

// body-parser/raw-body сообщают о превышении лимита размера тела запроса именно так — это задокументированный способ, не своя выдумка
const isEntityTooLargeError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large';
};

// надо 4 параметра, чтобы экспресс понимал, что это обработчик ошибок
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, next) => {
  const safeUrl = sanitizeUrl(request.originalUrl);
  logger.error([safeUrl, error instanceof Error ? error.message : String(error)].join(' '));

  if (isEntityTooLargeError(error)) {
    return response.status(413).json(new AppError(413, 'Payload Too Large'));
  }

  // Normalize Multer size errors so upload clients receive a 413 instead of a generic 500.
  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FIELD_VALUE';
    const statusCode = isTooLarge ? 413 : 400;

    return response
      .status(statusCode)
      .json(new AppError(statusCode, isTooLarge ? 'Payload Too Large' : 'Invalid multipart form'));
  }

  return error instanceof AppError
    ? response.status(error.statusCode).json(error)
    : response.status(500).json({ message: 'Something went wrong :(' });
};
