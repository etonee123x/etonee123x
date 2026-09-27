import type { RequestHandler } from 'express';
// выключаю, т.к. файл технический, создан как раз для того чтобы работать с OpenAPI типами
// eslint-disable-next-line no-restricted-imports
import type { paths } from '@/types/openapi';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type Operation<RoutePath extends keyof paths, Method extends HttpMethod> = paths[RoutePath][Method];

type PathParameters<RoutePath extends keyof paths, Method extends HttpMethod> =
  Operation<RoutePath, Method> extends { parameters: { path: infer T } } ? T : Record<string, never>;

type QueryParameters<RoutePath extends keyof paths, Method extends HttpMethod> =
  Operation<RoutePath, Method> extends { parameters: { query: infer T } } ? T : Record<string, never>;

type JsonResponseBody<RoutePath extends keyof paths, Method extends HttpMethod, StatusCode extends number> =
  Operation<RoutePath, Method> extends { responses: infer Responses }
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Responses extends Record<number, any>
      ? Responses[StatusCode] extends {
          content: { 'application/json': infer T };
        }
        ? T
        : never
      : never
    : never;

type ResolveBody<BodyOverride> = [BodyOverride] extends [undefined] ? undefined : BodyOverride;

export type RequestHandlerTyped<
  RoutePath extends keyof paths,
  Method extends HttpMethod,
  BodyOverride = undefined,
  StatusCode extends number = 200,
> = RequestHandler<
  PathParameters<RoutePath, Method>,
  JsonResponseBody<RoutePath, Method, StatusCode>,
  ResolveBody<BodyOverride>,
  QueryParameters<RoutePath, Method>
>;
