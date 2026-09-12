import Express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';

import { errorHandler } from '@/middlewares/error-handler.middleware';
import { send404 } from '@/middlewares/send-404.middleware';
import { appConfig } from '@/config/app-config';

import { PostsModule } from '@/modules/posts/posts.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { FolderDataModule } from '@/modules/folder-data/folder-data.module';
import { HealthModule } from '@/modules/health/health.module';

export const createApp = () => {
  const router = Express.Router();

  for (const module of [new PostsModule(), new AuthModule(), new FolderDataModule(), new HealthModule()]) {
    module.init(router);
  }

  const app = Express() //
    .use(helmet())
    .use(
      cors({
        origin: appConfig.corsOrigins,
        credentials: true,
      }),
    )
    .use(cookieParser())
    .use(Express.json({ limit: appConfig.jsonBodyLimit }));

  if (appConfig.isDevelopment) {
    // Development serves extracted covers beside existing public file roots.
    app
      .use('/content', Express.static(appConfig.contentPath))
      .use('/uploads', Express.static(appConfig.uploadsPath))
      .use('/covers', Express.static(appConfig.audioCoversPath));
  }

  return app //
    .use(router)
    .use(errorHandler)
    .use(send404);
};
