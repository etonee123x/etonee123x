import { isNil } from '@/shared/utils/is-nil';
import { FILE_TYPES } from './file-types';

const EXTENSIONS_AUDIO = new Set(['mp3', 'mpeg', 'ogg', 'wav']);
const EXTENSIONS_IMAGE = new Set(['jpg', 'jpeg', 'png']);
const EXTENSIONS_VIDEO = new Set(['mp4', 'webm']);

export const extensionToFileType = (extension: string | null | undefined) => {
  if (isNil(extension)) {
    return FILE_TYPES.UNKNOWN;
  }

  const extensionLowerCased = extension.toLowerCase();

  if (EXTENSIONS_AUDIO.has(extensionLowerCased)) {
    return FILE_TYPES.AUDIO;
  }

  if (EXTENSIONS_IMAGE.has(extensionLowerCased)) {
    return FILE_TYPES.IMAGE;
  }

  if (EXTENSIONS_VIDEO.has(extensionLowerCased)) {
    return FILE_TYPES.VIDEO;
  }

  return FILE_TYPES.UNKNOWN;
};
