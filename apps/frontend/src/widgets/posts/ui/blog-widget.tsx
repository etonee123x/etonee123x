import { getTranslations } from 'next-intl/server';
import { MoveRight } from 'lucide-react';

import { getPosts } from '@/entities/post';
import { Link } from '@/i18n/navigation';
import { Post } from './post';

/** Shows the latest post and links to the remaining blog posts. */
export const BlogWidget = async () => {
  const t = await getTranslations('BlogWidget');
  const posts = await getPosts({ pageSize: 1 });
  const latestPost = posts.rows[0];
  const postCount = posts._meta.total;

  return (
    <div className="flex flex-col gap-2 rounded-4xl border border-primary/40 bg-primary/5 p-4">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-baseline gap-x-2 gap-y-1">
        <hgroup className="contents">
          <h2 className="col-start-1 row-start-1 min-w-0 text-xl font-semibold tracking-tight">{t('blog')}</h2>
          <p className="col-span-2 row-start-2 min-w-0 wrap-break-word text-sm text-muted-foreground">
            {t('whatIWriteAbout')}
          </p>
        </hgroup>
        <Link
          className="col-start-2 row-start-1 flex min-w-0 max-w-full items-center gap-1 justify-self-end text-right text-xs leading-none text-foreground transition-colors hover:text-foreground/80"
          href="/blog"
        >
          {t('seeAllPosts', { count: postCount })}
          <MoveRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {latestPost ? (
        <Post post={latestPost} selectedPostId={null} />
      ) : (
        <p className="text-muted-foreground">{t('noPostsYet')}</p>
      )}
    </div>
  );
};
