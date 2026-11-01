import { afterEach, describe, expect, it, vi } from 'vitest';
import { TagRevalidator } from './tag-revalidator';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TagRevalidator', () => {
  it('posts the tag to Next.js with the shared secret', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const revalidator = new TagRevalidator({
      nextServerUrl: 'http://localhost:3000',
      secret: 'revalidation-secret',
    });

    await revalidator.revalidate('posts');

    expect(fetchMock).toHaveBeenCalledWith(new URL('http://localhost:3000/api/revalidate'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-secret': 'revalidation-secret',
      },
      body: JSON.stringify({ tag: 'posts' }),
    });
  });

  it('throws when Next.js rejects the revalidation request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    const revalidator = new TagRevalidator({
      nextServerUrl: 'http://localhost:3000',
      secret: 'revalidation-secret',
    });

    await expect(revalidator.revalidate('posts')).rejects.toThrow('Next.js cache revalidation failed with status 500');
  });
});
