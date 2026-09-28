import type { components } from '@/shared/api/openapi';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getPostDescriptionContent } from './get-post-description-content';

/** Builds a localized description for a post in a Server Component. */
export const getPostDescription = async (post: components['schemas']['PostResponse']) => {
  const content = getPostDescriptionContent(post.text);
  if (content) {
    return content;
  }

  const [t, formatter] = await Promise.all([getTranslations('PostDescription'), getFormatter()]);

  return t('aPostInMyBlog', {
    date: formatter.dateTime(post._meta.createdAt, { dateStyle: 'long', timeZone: 'UTC' }),
    count: post.attachments.length,
  });
};
