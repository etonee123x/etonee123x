import { getTranslations } from 'next-intl/server';

import { getPosts } from '@/entities/post';
import { WidgetPanel } from '@/shared/ui/widget-panel';
import { Post } from './post';

/** Shows the latest post and links to the remaining blog posts. */
export const BlogWidget = async () => {
  const t = await getTranslations('BlogWidget');
  const posts = await getPosts({ pageSize: 1 });
  const latestPost = posts.rows[0];
  const postCount = posts._meta.total;

  return (
    <WidgetPanel
      title={t('blog')}
      description={t('whatIWriteAbout')}
      link={{ href: '/blog', children: t('seeAllPosts', { count: postCount }) }}
    >
      {latestPost ? (
        <Post post={latestPost} selectedPostId={null} />
      ) : (
        <p className="text-muted-foreground">{t('noPostsYet')}</p>
      )}
    </WidgetPanel>
  );
};
