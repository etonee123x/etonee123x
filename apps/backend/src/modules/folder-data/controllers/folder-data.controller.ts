import { query } from 'express-validator';
import { requestToUrl } from '@/utils/request-to-url';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { validateRequest } from '@/middlewares/validate-request.middleware';
import { FolderDataService } from '../services/folder-data.service';
import { Controller } from '@/shared/controller';
import { AppError } from '@/shared/errors/app.error';

const folderDataGetValidationRules = [
  query('path')
    .isString()
    .notEmpty()
    .withMessage('path is required and must be a string')
    .custom((value: string) => {
      return value.startsWith('/');
    })
    .withMessage('path must start with /'),
  validateRequest,
];

export class FolderDataController extends Controller {
  private readonly folderDataService: FolderDataService;

  private getFolderData: RequestHandlerTyped<'/folder-data', 'get'> = async (request, response) => {
    const url = requestToUrl(request);

    const path = url.searchParams.get('path');
    if (!path) {
      throw new AppError(400, 'path is required');
    }

    const folderData = await this.folderDataService.getFolderData({ pathAsRelativeUrl: path });

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
