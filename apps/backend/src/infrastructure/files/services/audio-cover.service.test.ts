import nodeFsPromises from 'node:fs/promises';
import nodeOs from 'node:os';
import nodePath from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { AudioCoverService } from './audio-cover.service';

describe('AudioCoverService', () => {
  it('stores cover by content hash and reuses existing file', async () => {
    const directory = await nodeFsPromises.mkdtemp(nodePath.join(nodeOs.tmpdir(), 'audio-covers-'));
    const coverBuffer = Buffer.from('same-album-cover');
    const existingFileBuffer = Buffer.from('existing-cover-file');
    const expectedHash = createHash('sha256').update(coverBuffer).digest('hex');
    const expectedPath = nodePath.join(directory, `${expectedHash}.jpg`);
    const service = new AudioCoverService({ directory });

    try {
      const firstSource = await service.save({ buffer: coverBuffer, format: 'image/jpeg' });
      await nodeFsPromises.writeFile(expectedPath, existingFileBuffer);
      const secondSource = await service.save({ buffer: coverBuffer, format: 'image/jpeg' });

      // Same bytes produce same public source and do not require duplicate cover files.
      expect(firstSource).toBe(`/covers/${expectedHash}.jpg`);
      expect(secondSource).toBe(firstSource);
      await expect(nodeFsPromises.readFile(expectedPath)).resolves.toEqual(existingFileBuffer);
    } finally {
      await nodeFsPromises.rm(directory, { recursive: true, force: true });
    }
  });

  it('stores valid images as bounded webp previews', async () => {
    const directory = await nodeFsPromises.mkdtemp(nodePath.join(nodeOs.tmpdir(), 'audio-covers-'));
    const coverBuffer = await sharp({
      create: {
        width: 900,
        height: 700,
        channels: 3,
        background: '#ffcc00',
      },
    })
      .png()
      .toBuffer();
    const service = new AudioCoverService({ directory });

    try {
      const source = await service.save({ buffer: coverBuffer, format: 'image/png' });
      const fileName = nodePath.basename(source);
      const storedBuffer = await nodeFsPromises.readFile(nodePath.join(directory, fileName));
      const metadata = await sharp(storedBuffer).metadata();

      // Stored covers stay browser-friendly and small enough for repeated audio cards.
      expect(source).toMatch(/^\/covers\/[a-f0-9]{64}\.webp$/);
      expect(metadata.format).toBe('webp');
      expect(Math.max(metadata.width, metadata.height)).toBeLessThanOrEqual(512);
      expect(storedBuffer.length).toBeLessThan(coverBuffer.length);
    } finally {
      await nodeFsPromises.rm(directory, { recursive: true, force: true });
    }
  });

  it('clears stored covers', async () => {
    const directory = await nodeFsPromises.mkdtemp(nodePath.join(nodeOs.tmpdir(), 'audio-covers-'));
    const service = new AudioCoverService({ directory });
    await nodeFsPromises.writeFile(nodePath.join(directory, 'cover.webp'), 'cover');

    const result = await service.clear();

    // Clear hides filesystem details from scripts and stays safe when the directory is already absent.
    expect(result).toEqual({ filesCount: 1, bytes: 5 });
    await expect(nodeFsPromises.access(directory)).rejects.toThrow();
    await expect(service.clear()).resolves.toEqual({ filesCount: 0, bytes: 0 });
  });
});
