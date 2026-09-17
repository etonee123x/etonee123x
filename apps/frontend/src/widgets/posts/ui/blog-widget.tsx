import { getTranslations } from 'next-intl/server';

import { getPosts } from '@/entities/post';
import { WidgetPanel } from '@/shared/ui/widget-panel';
import { Post } from './post';

/** Shows the latest post and links to the remaining blog posts. */
export const BlogWidget = async () => {
  const t = await getTranslations('BlogWidget');
  const posts = await getPosts({ pageSize: 1 });
  const newestPost = posts.rows[0];
  const postCount = posts._meta.total;

  if (!newestPost) {
    return null;
  }

  return (
    <WidgetPanel
      title={t('blog')}
      description={t('whatIWriteAbout')}
      link={{ href: '/blog', children: t('seeAllPosts', { count: postCount }) }}
    >
      <Post post={newestPost} selectedPostId={null} />
    </WidgetPanel>
  );
};
