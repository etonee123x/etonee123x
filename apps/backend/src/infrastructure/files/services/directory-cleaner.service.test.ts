import nodeFsPromises from 'node:fs/promises';
import nodeOs from 'node:os';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { DirectoryCleaner } from './directory-cleaner.service';

describe('DirectoryCleaner', () => {
  it('clears directory and returns removed file stats', async () => {
    const directory = await nodeFsPromises.mkdtemp(nodePath.join(nodeOs.tmpdir(), 'directory-cleaner-'));
    const nestedDirectory = nodePath.join(directory, 'nested');
    const directoryCleaner = new DirectoryCleaner();

    await nodeFsPromises.mkdir(nestedDirectory);
    await nodeFsPromises.writeFile(nodePath.join(directory, 'a.txt'), 'abc');
    await nodeFsPromises.writeFile(nodePath.join(nestedDirectory, 'b.txt'), 'de');

    const result = await directoryCleaner.clear(directory);

    // Stats are computed before deletion so cleanup scripts can log removed file count and bytes.
    expect(result).toEqual({ filesCount: 2, bytes: 5 });
    await expect(nodeFsPromises.access(directory)).rejects.toThrow();
    await expect(directoryCleaner.clear(directory)).resolves.toEqual({ filesCount: 0, bytes: 0 });
  });
});
