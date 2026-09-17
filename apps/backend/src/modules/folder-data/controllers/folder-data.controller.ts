import { query } from 'express-validator';
import { requestToUrl } from '@/utils/request-to-url';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { validateRequest } from '@/middlewares/validate-request.middleware';
import { FolderDataService } from '../services/folder-data.service';
import { Controller } from '@/shared/controller';
import { AppError } from '@/shared/errors/app.error';

const folderDataGetValidationRules = [
  query('path').optional().isString().notEmpty().withMessage('path must be a non-empty string'),
  query('path')
    .optional()
    .custom((value: string) => {
      return value.startsWith('/');
    })
    .withMessage('path must start with /'),
  query('path')
    .optional()
    .custom((value: string, { req }) => {
      if (value && req.query?.isNewest === 'true') {
        throw new Error('path and isNewest are mutually exclusive');
      }

      return true;
    }),
  query('isNewest').optional().isBoolean().withMessage('isNewest must be a boolean'),
  query('isNewest')
    .optional()
    .custom((value: string, { req }) => {
      if (value !== 'true') {
        throw new Error('isNewest must be true');
      }

      if (req.query?.path) {
        throw new Error('path and isNewest are mutually exclusive');
      }

      return true;
    }),
  validateRequest,
];

export class FolderDataController extends Controller {
  private readonly folderDataService: FolderDataService;

  private getFolderData: RequestHandlerTyped<'/folder-data', 'get'> = async (request, response) => {
    const url = requestToUrl(request);

    const path = url.searchParams.get('path');
    const isNewest = url.searchParams.get('isNewest') === 'true';

    if (!path && !isNewest) {
      throw new AppError(400, 'path or isNewest is required');
    }

    const folderData = isNewest
      ? await this.folderDataService.getNewestFolderData()
      : await this.folderDataService.getFolderData({ pathAsRelativeUrl: path as string });

    return response.send(folderData);
  };

  private getAllFolderDataPaths: RequestHandlerTyped<'/folder-data/all-paths', 'get'> = async (...[, response]) => {
    const paths = await this.folderDataService.getAllFilePaths();

    return response.send(paths);
  };

  constructor(parameters: { folderDataService: FolderDataService }) {
    super();

    this.folderDataService = parameters.folderDataService;

    this.router.get('/folder-data', ...folderDataGetValidationRules, this.getFolderData);
    this.router.get('/folder-data/all-paths', this.getAllFolderDataPaths);
  }
}
