import { parseBuffer, type IPicture } from 'music-metadata';
import { FILE_TYPES } from '@/shared/domain/file-types/file-types.domain';
import type { StoredFileAudio } from '@/shared/domain/stored-file/audio.stored-file';
import { FileInspectorBase } from './base.file-inspector';
import type { StoredFileSource } from '../types/stored-file-source';
import type { FilesStorage } from '../storages/files-storage';
import type { AudioCoverService } from '../services/audio-cover.service';

export class AudioFileInspector extends FileInspectorBase {
  private readonly audioCoverService: AudioCoverService | null;

  constructor(parameters: { filesStorage: FilesStorage; audioCoverService: AudioCoverService | null }) {
    super({ filesStorage: parameters.filesStorage });
    // Null is reserved for isolated tests that intentionally skip cover persistence.
    this.audioCoverService = parameters.audioCoverService;
  }

  private async getCover(pictures: Array<IPicture>): Promise<{ src: string; width: number; height: number } | null> {
    const firstPicture = pictures[0];
    if (!(firstPicture && this.audioCoverService)) {
      return null;
    }

    // Hashing and dedupe live in the cover service; inspector only chooses the first embedded picture.
    return this.audioCoverService.save({ buffer: Buffer.from(firstPicture.data), format: firstPicture.format });
  }

  canInspect(parameters: { fileType: (typeof FILE_TYPES)[keyof typeof FILE_TYPES] }) {
    return parameters.fileType === FILE_TYPES.AUDIO;
  }

  async inspect(parameters: { key: string; storedFileSource: StoredFileSource }): Promise<StoredFileAudio> {
    const base = await super.inspect({ key: parameters.key });
    const buffer = await parameters.storedFileSource.getBuffer();
    const audioMetadata = await parseBuffer(buffer);
    const cover = await this.getCover(audioMetadata.common.picture ?? []);

    const specific = {
      metadata: {
        cover,
        duration: (audioMetadata.format.duration ?? 0) * 1000,
        bitrate: audioMetadata.format.bitrate ? audioMetadata.format.bitrate / 1000 : null,
        album: audioMetadata.common.album ?? null,
        artists: audioMetadata.common.artists ?? [],
        bpm: audioMetadata.common.bpm ?? null,
        year: audioMetadata.common.year ?? null,
      },
    };

    return {
      ...base,
      ...specific,
      fileType: FILE_TYPES.AUDIO,
    };
  }
}
