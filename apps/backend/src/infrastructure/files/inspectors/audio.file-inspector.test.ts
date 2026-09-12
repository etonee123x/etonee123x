import { describe, expect, it, vi } from 'vitest';

vi.mock('music-metadata', () => {
  return {
    parseBuffer: vi.fn(),
  };
});

import { parseBuffer } from 'music-metadata';
import { FILE_TYPES, ITEM_TYPES } from '@/shared/domain/file-types/file-types.domain';
import { AudioFileInspector } from '@/infrastructure/files/inspectors/audio.file-inspector';

const buildFilesStorage = () => {
  // Tests only need common file metadata; buffer loading is supplied by StoredFileSource.
  return {
    getStoredFileBase: vi.fn().mockResolvedValue({
      name: 'audio.mp3',
      extension: 'mp3',
      itemType: ITEM_TYPES.FILE,
      _meta: { createdAt: 1, updatedAt: 2 },
      src: '/content/audio.mp3',
    }),
  };
};

describe('AudioFileInspector', () => {
  it('maps metadata from music-metadata response', async () => {
    const mockedParseBuffer = vi.mocked(parseBuffer);
    mockedParseBuffer.mockResolvedValue({
      format: { duration: 2.5, bitrate: 320_000 },
      common: {
        album: 'Album',
        artists: ['Artist'],
        bpm: 120,
        year: 2020,
      },
    } as never);

    const filesStorage = buildFilesStorage();
    const inspector = new AudioFileInspector({ filesStorage: filesStorage as never, audioCoverService: null });

    const result = await inspector.inspect({
      key: 'audio.mp3',
      storedFileSource: {
        getBuffer: async () => {
          return Buffer.from('audio');
        },
      },
    });

    expect(result).toEqual({
      name: 'audio.mp3',
      extension: 'mp3',
      itemType: ITEM_TYPES.FILE,
      _meta: { createdAt: 1, updatedAt: 2 },
      src: '/content/audio.mp3',
      fileType: FILE_TYPES.AUDIO,
      metadata: {
        cover: null,
        duration: 2500,
        bitrate: 320,
        album: 'Album',
        artists: ['Artist'],
        bpm: 120,
        year: 2020,
      },
    });
  });

  it('fills defaults when metadata is missing', async () => {
    const mockedParseBuffer = vi.mocked(parseBuffer);
    mockedParseBuffer.mockResolvedValue({
      format: {},
      common: {},
    } as never);

    const filesStorage = buildFilesStorage();
    const inspector = new AudioFileInspector({ filesStorage: filesStorage as never, audioCoverService: null });

    const result = await inspector.inspect({
      key: 'audio.mp3',
      storedFileSource: {
        getBuffer: async () => {
          return Buffer.from('audio');
        },
      },
    });

    expect(result).toEqual({
      name: 'audio.mp3',
      extension: 'mp3',
      itemType: ITEM_TYPES.FILE,
      _meta: { createdAt: 1, updatedAt: 2 },
      src: '/content/audio.mp3',
      fileType: FILE_TYPES.AUDIO,
      metadata: {
        cover: null,
        duration: 0,
        bitrate: null,
        album: null,
        artists: [],
        bpm: null,
        year: null,
      },
    });
  });

  it('saves embedded cover and returns stored cover source', async () => {
    const mockedParseBuffer = vi.mocked(parseBuffer);
    const coverBuffer = Buffer.from('cover');
    mockedParseBuffer.mockResolvedValue({
      format: {},
      common: {
        picture: [{ format: 'image/jpeg', data: coverBuffer }],
      },
    } as never);

    const audioCoverService = {
      save: vi.fn().mockResolvedValue({ src: '/covers/hash.jpg', width: 100, height: 80 }),
    };
    const inspector = new AudioFileInspector({
      filesStorage: buildFilesStorage() as never,
      audioCoverService: audioCoverService as never,
    });

    const result = await inspector.inspect({
      key: 'audio.mp3',
      storedFileSource: {
        getBuffer: async () => {
          return Buffer.from('audio');
        },
      },
    });

    // Inspector passes exact embedded bytes so the service can hash identical album art once.
    expect(audioCoverService.save).toHaveBeenCalledWith({ buffer: coverBuffer, format: 'image/jpeg' });
    expect(result.metadata.cover).toEqual({
      src: '/covers/hash.jpg',
      width: 100,
      height: 80,
    });
  });
});
