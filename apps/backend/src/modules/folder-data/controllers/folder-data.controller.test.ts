import Express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { errorHandler } from '@/middlewares/error-handler.middleware';
import { FolderDataController } from '@/modules/folder-data/controllers/folder-data.controller';

const buildApp = (folderDataService: unknown) => {
  const app = Express();

  const controller = new FolderDataController({
    folderDataService: folderDataService as never,
  });

  app.use(controller.router);
  app.use(errorHandler);

  return app;
};

describe('FolderDataController', () => {
  it('returns 400 when path query is missing', async () => {
    const getFolderData = vi.fn();

    const app = buildApp({ getFolderData });

    const response = await request(app).get('/folder-data').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
    expect(getFolderData).not.toHaveBeenCalled();
  });

  it('returns service response when path is provided and starts with /', async () => {
    const payload = {
      folders: [],
      files: [],
      file: null,
      pathDirectory: '/music',
    };

    const getFolderData = vi.fn(async () => {
      return payload;
    });

    const app = buildApp({ getFolderData });

    const response = await request(app).get('/folder-data?path=/music').expect(200);

    expect(getFolderData).toHaveBeenCalledWith({ pathAsRelativeUrl: '/music' });
    expect(response.body).toEqual(payload);
  });

  it('returns the newest folder when newest is true', async () => {
    const payload = {
      folders: [],
      files: [],
      file: null,
      pathDirectory: '/latest',
    };

    const getNewestFolderData = vi.fn(async () => {
      return payload;
    });

    const app = buildApp({ getNewestFolderData });

    const response = await request(app).get('/folder-data?isNewest=true').expect(200);

    expect(getNewestFolderData).toHaveBeenCalledOnce();
    expect(response.body).toEqual(payload);
  });

  it('rejects requests that pass both path and isNewest together', async () => {
    const getFolderData = vi.fn();
    const getNewestFolderData = vi.fn();

    const app = buildApp({ getFolderData, getNewestFolderData });

    const response = await request(app).get('/folder-data?path=/music&isNewest=true').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
    expect(getFolderData).not.toHaveBeenCalled();
    expect(getNewestFolderData).not.toHaveBeenCalled();
  });

  it('rejects false isNewest value', async () => {
    const getFolderData = vi.fn();
    const getNewestFolderData = vi.fn();

    const app = buildApp({ getFolderData, getNewestFolderData });

    const response = await request(app).get('/folder-data?isNewest=false').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
    expect(getFolderData).not.toHaveBeenCalled();
    expect(getNewestFolderData).not.toHaveBeenCalled();
  });

  it('returns 400 when path does not start with /', async () => {
    const getFolderData = vi.fn();

    const app = buildApp({ getFolderData });

    const response = await request(app).get('/folder-data?path=music').expect(400);

    expect(response.body).toMatchObject({ statusCode: 400 });
    expect(getFolderData).not.toHaveBeenCalled();
  });

  it('returns all file/folder paths from /folder-data/all-paths', async () => {
    const payload = [{ path: '/album/song.mp3', createdAt: 1, updatedAt: 2 }];

    const getAllFilePaths = vi.fn(async () => {
      return payload;
    });

    const app = buildApp({ getAllFilePaths });

    const response = await request(app).get('/folder-data/all-paths').expect(200);

    expect(getAllFilePaths).toHaveBeenCalledOnce();
    expect(response.body).toEqual(payload);
  });
});
