import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '@/app';
import { appConfig } from '@/config/app-config';

describe('API smoke', () => {
  it('returns 404 for unknown route', async () => {
    const app = createApp();

    await request(app).get('/__unknown-route').expect(404);
  });

  it('returns 400 when required query is missing', async () => {
    const app = createApp();

    const response = await request(app).get('/folder-data').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
  });

  /**
   * Verifies three contact submissions succeed per day and the fourth is rate limited.
   */
  it('limits contact messages to three submissions per day', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      return Response.json({ ok: true, result: {} });
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      const app = createApp();

      for (let count = 0; count < 3; count += 1) {
        await request(app).post('/contact-me').send({ text: 'Hello', contact: 'reader@example.com' }).expect(204);
      }

      await request(app).post('/contact-me').send({ text: 'Hello', contact: 'reader@example.com' }).expect(429);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  /**
   * Rejects invalid contact payloads before attempting Telegram delivery.
   */
  it('rejects invalid contact payloads before attempting Telegram delivery', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const invalidPayloads = [
      { text: ' '.repeat(3) },
      { text: 42 },
      { text: 'x'.repeat(5001) },
      { text: 'Hello', contact: 42 },
      { text: 'Hello', contact: 'x'.repeat(321) },
      { text: 'Hello', extra: true },
    ];

    try {
      for (const payload of invalidPayloads) {
        const response = await request(createApp()).post('/contact-me').send(payload).expect(400);

        expect(response.body).toMatchObject({ statusCode: 400 });
      }

      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  /**
  Verifies the registered endpoint persists only the token digest.
  */
  it('creates a one-time token and stores only its hash', async () => {
    const previousDatabasePath = appConfig.databasePath;
    const databaseDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'one-time-token-'));
    (appConfig as unknown as { databasePath: string }).databasePath = databaseDirectory;

    try {
      const requestStartedAt = Date.now();
      const response = await request(createApp())
        .post('/one-time-token')
        .set('x-secret', appConfig.oneTimeTokenSecret)
        .expect(200);
      const { token } = response.body as { token: string };
      const rows = JSON.parse(
        await fs.readFile(path.join(databaseDirectory, 'one-time-tokens.json'), 'utf8'),
      ) as Array<{
        tokenHash: string;
        _meta: { createdAt: number };
      }>;

      expect(rows).toHaveLength(1);
      expect(rows[0]?.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
      expect(rows[0]?.tokenHash).not.toBe(token);
      expect(rows[0]?._meta.createdAt).toBeGreaterThanOrEqual(requestStartedAt);
      expect(rows[0]?._meta.createdAt).toBeLessThanOrEqual(Date.now());
    } finally {
      (appConfig as unknown as { databasePath: string }).databasePath = previousDatabasePath;
      await fs.rm(databaseDirectory, { recursive: true, force: true });
    }
  });

  it('sets security headers via helmet', async () => {
    const app = createApp();

    const response = await request(app).get('/__unknown-route');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('sets CORS headers for allowed origin', async () => {
    const app = createApp();

    const response = await request(app).get('/health/live').set('Origin', 'http://localhost:3000').expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects JSON payloads exceeding size limit', async () => {
    const previousLimit = appConfig.jsonBodyLimit;
    (appConfig as unknown as { jsonBodyLimit: string }).jsonBodyLimit = '100b';

    const app = createApp();
    const largeObject = { text: 'x'.repeat(200) };

    const response = await request(app).post('/auth').send(largeObject).expect(413);

    expect(response.body).toMatchObject({ statusCode: 413 });

    (appConfig as unknown as { jsonBodyLimit: string }).jsonBodyLimit = previousLimit;
  });
});
