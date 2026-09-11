import { describe, expect, it } from 'vitest';

import { formatBytes } from './format-bytes';

describe('formatBytes', () => {
  it('formats byte counts with binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KiB');
    expect(formatBytes(1536)).toBe('1.5 KiB');
    expect(formatBytes(1024 * 1024)).toBe('1 MiB');
  });
});
