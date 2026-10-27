import { client } from '@/shared/api/client';
import type { components } from '@/shared/api/openapi';

/** Expire all post variants only after Express authorizes and completes the update. */
export const patchPostById = async (
  id: components['schemas']['PostResponse']['_meta']['id'],
  data: Omit<components['schemas']['PostUpdateRequest'], 'files'>,
  files: Array<File>,
) => {
  const response = await client['/posts/{id}'].PATCH({
    params: {
      path: {
        id,
      },
    },
    body: {
      ...data,
      // актуальные данные в сериализаторе!
      files: [],
    },
    bodySerializer: (body) => {
      const formData = new FormData();

      formData.append('text', body.text);
      formData.append('attachmentsIds', JSON.stringify(body.attachmentsIds));

      files.forEach((file) => {
        formData.append('files', file);
      });

      return formData;
    },
  });

  if (response.data) {
    return response.data;
  }

  throw new Error(response.error.message);
};
