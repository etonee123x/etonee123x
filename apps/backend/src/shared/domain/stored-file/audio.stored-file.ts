import type { FILE_TYPES } from '@/shared/domain/file-types/file-types.domain';
import type { StoredFileBase } from './base.stored-file';

export interface StoredFileAudio extends StoredFileBase {
  fileType: (typeof FILE_TYPES)['AUDIO'];
  metadata: {
    coverSrc: string | null;
    duration: number;
    bitrate: number | null;
    album: string | null;
    artists: Array<string>;
    bpm: number | null;
    year: number | null;
  };
}
