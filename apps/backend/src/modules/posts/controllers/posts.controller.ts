import { query, body, param } from 'express-validator';
import { nonNullable } from '@/utils/non-nullable';
import { requestToUrl } from '@/utils/request-to-url';
import type { components } from '@/types/openapi';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { cookieAuth } from '@/middlewares/cookie-auth.middleware';
import { validateRequest } from '@/middlewares/validate-request.middleware';
import { PostsService } from '../services/posts.service';
import { idioticFieldMultipartFormDataToJsonParser } from '../middlewares/idiotic-field-multipart-form-data-to-json-parser.middleware';
import { parseFiles } from '../middlewares/parse-files.middleware';
import { Controller } from '@/shared/controller';

const postsGetValidationRules = [
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('pageSize must be an integer between 1 and 100'),
  query('filters[cursorPrevious]').optional().isString().withMessage('cursorPrevious must be a string'),
  query('filters[cursorNext]').optional().isString().withMessage('cursorNext must be a string'),
  query('filters[postId]').optional().isString().withMessage('postId must be a string'),
  validateRequest,
];

const postCreateValidationRules = [body('text').isString().withMessage('text must be a string'), validateRequest];

const postUpdateValidationRules = [
  param('id').isString().notEmpty().withMessage('id is required'),
  body('text').isString().withMessage('text must be a string'),
  body('attachments').isArray().withMessage('attachments must be an array'),
  validateRequest,
];

const postDeleteValidationRules = [param('id').isString().notEmpty().withMessage('id is required'), validateRequest];

export class PostsController extends Controller {
  private getPosts: RequestHandlerTyped<'/posts', 'get'> = async (request, response) => {
    const url = requestToUrl(request);
    const pageSize = Number(nonNullable(url.searchParams.get('pageSize') ?? 10));
    const cursorPrevious = url.searchParams.get('filters[cursorPrevious]');
    const cursorNext = url.searchParams.get('filters[cursorNext]');
    const postId = url.searchParams.get('filters[postId]');

    const posts = await this.postsService.getPosts({ cursorPrevious, cursorNext, postId, pageSize });

    response.send(posts);
  };

  private createPost: RequestHandlerTyped<'/posts', 'post', Omit<components['schemas']['PostCreateRequest'], 'files'>> =
    async (request, response) => {
      const files = request.files as Array<globalThis.Express.Multer.File>;
      const text = request.body.text;

      const createdPost = await this.postsService.createPost({ text, files });

      return response.send(createdPost);
    };

  private updatePostById: RequestHandlerTyped<
    '/posts/{id}',
    'patch',
    Omit<components['schemas']['PostUpdateRequest'], 'files'>
  > = async (request, response) => {
    const id = request.params.id;
    const files = request.files as Array<globalThis.Express.Multer.File>;
    const attachments = request.body.attachments;
    const text = request.body.text;

    const updatedPost = await this.postsService.updatePostById({
      id,
      text,
      files,
      attachments,
    });

    return response.send(updatedPost);
  };

  private deletePostById: RequestHandlerTyped<'/posts/{id}', 'delete'> = async (request, response) => {
    const id = request.params.id;

    const deletedPost = await this.postsService.deletePostById({ id });

    return response.send(deletedPost);
  };

  private readonly postsService: PostsService;

  constructor(parameters: { postsService: PostsService }) {
    super();
    this.postsService = parameters.postsService;

    this.router.get('/posts', ...postsGetValidationRules, this.getPosts);
    this.router.post('/posts', cookieAuth, parseFiles, ...postCreateValidationRules, this.createPost);
    this.router.patch(
      '/posts/:id',
      cookieAuth,
      parseFiles,
      idioticFieldMultipartFormDataToJsonParser(['attachments']),
      ...postUpdateValidationRules,
      this.updatePostById,
    );
    this.router.delete('/posts/:id', cookieAuth, ...postDeleteValidationRules, this.deletePostById);
  }
}
