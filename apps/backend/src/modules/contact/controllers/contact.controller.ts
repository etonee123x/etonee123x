import { body } from 'express-validator';
import type { components } from '@/types/openapi';
import type { RequestHandlerTyped } from '@/types/request-handler-typed';
import { Controller } from '@/shared/controller';
import { contactRateLimit } from '../middlewares/contact-rate-limit.middleware';
import type { ContactService } from '../services/contact.service';
import { validateRequest } from '@/middlewares/validate-request.middleware';

// Match the public schema at runtime, including rejecting extra properties.
const contactMessageValidationRules = [
  body()
    .isObject()
    .withMessage('body must be an object')
    .bail()
    .custom((value: Record<string, unknown>) => {
      return Object.keys(value).every((key) => {
        return ['text', 'contact'].includes(key);
      });
    })
    .withMessage('body contains unsupported properties'),
  body('text')
    .isString()
    .withMessage('text must be a string')
    .bail()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('text must contain between 1 and 2000 characters'),
  body('contact')
    .optional()
    .isString()
    .withMessage('contact must be a string')
    .bail()
    .isLength({ max: 320 })
    .withMessage('contact must not exceed 320 characters'),
  validateRequest,
];

export class ContactController extends Controller {
  private readonly contactService: ContactService;

  private submitContactMessage: RequestHandlerTyped<
    '/contact-me',
    'post',
    components['schemas']['ContactRequest'],
    204
  > = async (request, response) => {
    await this.contactService.submit(request.body);

    return response.status(204).end();
  };

  /**
   * Registers the public contact endpoint and its delivery service.
   */
  constructor(parameters: { contactService: ContactService }) {
    super();

    this.contactService = parameters.contactService;
    this.router.post('/contact-me', ...contactMessageValidationRules, contactRateLimit, this.submitContactMessage);
  }
}
