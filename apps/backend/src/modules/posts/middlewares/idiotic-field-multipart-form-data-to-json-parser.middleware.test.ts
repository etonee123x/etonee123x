import type Express from 'express';
import { describe, expect, it, vi } from 'vitest';

import { idioticFieldMultipartFormDataToJsonParser } from '@/modules/posts/middlewares/idiotic-field-multipart-form-data-to-json-parser.middleware';

describe('idioticFieldMultipartFormDataToJsonParser', () => {
  it('parses json string fields', () => {
    const middleware = idioticFieldMultipartFormDataToJsonParser(['attachmentsIds']);

    const request = {
      body: {
        attachmentsIds: '["a.mp3"]',
      },
    } as unknown as Express.Request;

    const next = vi.fn();

    middleware(request, {} as Express.Response, next);

    const body = request.body as Record<string, unknown>;
    expect(body.attachmentsIds).toEqual(['a.mp3']);
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws AppError 400 when json parsing fails', () => {
    const middleware = idioticFieldMultipartFormDataToJsonParser(['attachmentsIds']);

    const request = {
      body: {
        attachmentsIds: 'not-json',
      },
    } as unknown as Express.Request;

    const next = vi.fn();

    expect(() => {
      middleware(request, {} as Express.Response, next);
    }).toThrow("Invalid JSON in field 'attachmentsIds'");
    expect(next).not.toHaveBeenCalled();
  });

  it('leaves non-string values untouched', () => {
    const middleware = idioticFieldMultipartFormDataToJsonParser(['attachmentsIds']);

    const request = {
      body: {
        attachmentsIds: ['file-id'],
      },
    } as unknown as Express.Request;

    const next = vi.fn();

    middleware(request, {} as Express.Response, next);

    const body = request.body as Record<string, unknown>;
    expect(body.attachmentsIds).toEqual(['file-id']);
    expect(next).toHaveBeenCalledOnce();
  });
});
