'use client';

import type { components } from '@/shared/api/openapi';
import { useFormatter, useTranslations } from 'next-intl';
import { getPostDescriptionContent } from './get-post-description-content';

/** Builds a localized description for a post in a Client Component. */
export const usePostDescription = (post: components['schemas']['PostResponse']) => {
  const t = useTranslations('PostDescription');
  const { dateTime } = useFormatter();
  const content = getPostDescriptionContent(post.text);

  if (content) {
    return content;
  }

  return t('aPostInMyBlog', {
    date: dateTime(post._meta.createdAt, { dateStyle: 'long', timeZone: 'UTC' }),
    count: post.attachments.length,
  });
};
