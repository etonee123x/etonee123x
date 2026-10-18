import { updateTag } from 'next/cache';
import { client } from '@/shared/api/client';
import { getAuthHeaders } from '@/shared/api/get-auth-headers';
import type { components } from '@/shared/api/openapi';

/** Create through the authenticated backend before expiring every cached post listing. */
export const createPost = async (
  data: Omit<components['schemas']['PostCreateRequest'], 'files'>,
  files: Array<File>,
) => {
  const response = await client['/posts'].POST({
    headers: await getAuthHeaders(),
    body: {
      files: [],
      text: data.text,
    },
    bodySerializer: (body) => {
      const formData = new FormData();

      formData.append('text', body.text);

      files.forEach((file) => {
        formData.append('files', file);
      });

      return formData;
    },
  });

  if (response.data) {
    updateTag('posts');
    return response.data;
  }

  throw new Error(response.error.message);
};
