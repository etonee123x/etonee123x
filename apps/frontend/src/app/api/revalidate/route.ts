import { revalidateTag } from 'next/cache';

/** Revalidates one tagged cache entry for callers with the configured secret. */
export const POST = async (request: Request) => {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return Response.json({ error: 'Revalidation is not configured' }, { status: 500 });
  }

  if (request.headers.get('x-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('tag' in body) ||
    typeof body.tag !== 'string' ||
    body.tag.trim().length === 0 ||
    body.tag.length > 256
  ) {
    return Response.json({ error: 'A valid tag is required' }, { status: 400 });
  }

  revalidateTag(body.tag, { expire: 0 });

  return Response.json({ revalidated: true, tag: body.tag });
};
