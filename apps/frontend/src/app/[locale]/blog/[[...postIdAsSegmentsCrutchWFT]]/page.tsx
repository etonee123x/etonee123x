import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Separator } from '@/shared/ui/ds/separator';
import { getIsAdmin } from '@/entities/session/server';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getPostDescription, infiniteQueryOptionsGetPosts } from '@/entities/post';
import { Posts } from '@/widgets/posts';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/ui/ds/empty';
import type { Metadata } from 'next';
import { isNil } from '@/shared/utils/is-nil';
import { FILE_TYPES } from '@/entities/file';
import { getSiteImage, getAlternates } from '@/shared/lib/metadata';

const FormPostCreate = dynamic(() => {
  return import('@/features/post/editor').then((module) => {
    return module.FormPostCreate;
  });
});

export const generateMetadata = async ({
  params,
}: Readonly<PageProps<'/[locale]/blog/[[...postIdAsSegmentsCrutchWFT]]'>>): Promise<Metadata> => {
  const t = await getTranslations('Blog');

  const { postIdAsSegmentsCrutchWFT, locale } = await params;
  if (postIdAsSegmentsCrutchWFT && postIdAsSegmentsCrutchWFT.length > 1) {
    throw new Error('Invalid postIdAsSegmentsCrutchWFT length');
  }

  const postId = postIdAsSegmentsCrutchWFT?.[0] ?? null;

  const defaults = {
    title: t('blog'),
    alternates: getAlternates(postId ? `/blog/${postId}` : '/blog', locale),
    openGraph: {
      url: postId ? `/${locale}/blog/${postId}` : `/${locale}/blog`,
    },
  };

  if (isNil(postId)) {
    return {
      ...defaults,
      description: t('myBlog'),
    };
  }

  const queryClient = new QueryClient();
  const posts = await queryClient.infiniteQuery(infiniteQueryOptionsGetPosts(postId));

  const post = posts.pages
    .flatMap((page) => {
      return page.rows;
    })
    .find((post) => {
      return post._meta.id === postId;
    });

  if (!post) {
    throw new Error('Post not found');
  }

  // Use a blog-specific SEO fallback for posts without text.
  const description = getPostDescription(post.text) || t('postInMyBlog');

  const image = post.attachments.find((attachment) => {
    return attachment.fileType === FILE_TYPES.IMAGE;
  });

  const images = image
    ? [
        {
          url: image.src,
          width: image.metadata.width,
          height: image.metadata.height,
          alt: t('postAttachmentImage'),
        },
      ]
    : [await getSiteImage()];

  const video = post.attachments.find((attachment) => {
    return attachment.fileType === FILE_TYPES.VIDEO;
  });

  const audio = post.attachments.find((attachment) => {
    return attachment.fileType === FILE_TYPES.AUDIO;
  });

  return {
    ...defaults,
    description,
    openGraph: {
      ...defaults.openGraph,
      images,
      videos: video && {
        url: video.src,
        width: video.metadata.width,
        height: video.metadata.height,
      },
      audio: audio && {
        url: audio.src,
      },
    },
    twitter: {
      images,
    },
  };
};

export default async function Blog({ params }: Readonly<PageProps<'/[locale]/blog/[[...postIdAsSegmentsCrutchWFT]]'>>) {
  const { postIdAsSegmentsCrutchWFT } = await params;

  if (postIdAsSegmentsCrutchWFT && postIdAsSegmentsCrutchWFT.length > 1) {
    return notFound();
  }

  const postId = postIdAsSegmentsCrutchWFT?.[0] ?? null;

  const queryClient = new QueryClient();
  const posts = await queryClient.infiniteQuery(infiniteQueryOptionsGetPosts(postId)).catch(() => {
    return undefined;
  });
  if (!posts) {
    return notFound();
  }

  const hasPosts = posts.pages.some((page) => {
    return page.rows.length > 0;
  });

  const isAdmin = await getIsAdmin();

  const t = await getTranslations('Blog');

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="layout-container mb-6">
        <h1 className="h1 mb-6">{t('blog')}</h1>
        {isAdmin && (
          <>
            <FormPostCreate />
            <Separator className="my-4" />
          </>
        )}
        {hasPosts ? (
          <Posts selectedPostId={postId} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('noPosts')}</EmptyTitle>
              <EmptyDescription>{t('noPostsFound')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </HydrationBoundary>
  );
}
