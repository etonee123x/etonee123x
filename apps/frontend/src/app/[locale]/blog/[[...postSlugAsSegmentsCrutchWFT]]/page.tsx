import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Separator } from '@/shared/ui/ds/separator';
import { getIsAdmin } from '@/entities/session/server';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { infiniteQueryOptionsGetPosts } from '@/entities/post';
import { getPostDescription } from '@/entities/post/server';
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
}: Readonly<PageProps<'/[locale]/blog/[[...postSlugAsSegmentsCrutchWFT]]'>>): Promise<Metadata> => {
  const t = await getTranslations('Blog');

  const { postSlugAsSegmentsCrutchWFT, locale } = await params;
  if (postSlugAsSegmentsCrutchWFT && postSlugAsSegmentsCrutchWFT.length > 1) {
    throw new Error('Invalid postSlugAsSegmentsCrutchWFT length');
  }

  const postSlug = postSlugAsSegmentsCrutchWFT?.[0] ?? null;

  const defaults = {
    title: t('blog'),
    alternates: getAlternates(postSlug ? `/blog/${postSlug}` : '/blog', locale),
    openGraph: {
      url: postSlug ? `/${locale}/blog/${postSlug}` : `/${locale}/blog`,
    },
  };

  if (isNil(postSlug)) {
    return {
      ...defaults,
      description: t('myBlog'),
    };
  }

  const queryClient = new QueryClient();
  const posts = await queryClient.infiniteQuery(infiniteQueryOptionsGetPosts(postSlug));

  const post = posts.pages
    .flatMap((page) => {
      return page.rows;
    })
    .find((post) => {
      return post.slug === postSlug;
    });

  if (!post) {
    throw new Error('Post not found');
  }

  const description = await getPostDescription(post);

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

export default async function Blog({
  params,
}: Readonly<PageProps<'/[locale]/blog/[[...postSlugAsSegmentsCrutchWFT]]'>>) {
  const { postSlugAsSegmentsCrutchWFT } = await params;

  if (postSlugAsSegmentsCrutchWFT && postSlugAsSegmentsCrutchWFT.length > 1) {
    return notFound();
  }

  const postSlug = postSlugAsSegmentsCrutchWFT?.[0] ?? null;

  const queryClient = new QueryClient();
  const posts = await queryClient.infiniteQuery(infiniteQueryOptionsGetPosts(postSlug)).catch(() => {
    return undefined;
  });
  if (!posts) {
    return notFound();
  }

  const hasPosts = posts.pages.some((page) => {
    return page.rows.length > 0;
  });
  const selectedPost = isNil(postSlug)
    ? undefined
    : posts.pages
        .flatMap((page) => {
          return page.rows;
        })
        .find((post) => {
          return post.slug === postSlug;
        });
  const isAdmin = await getIsAdmin();

  const t = await getTranslations('Blog');
  const selectedPostDescription = selectedPost ? await getPostDescription(selectedPost) : '';

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <section className="layout-container mb-6">
        {/* Keep Blog as the page heading and add selected-post context for screen readers. */}
        <h1 className="h1 mb-6">
          {t('blog')}
          {selectedPostDescription && <span className="sr-only"> {selectedPostDescription}</span>}
        </h1>
        {isAdmin && (
          <>
            <FormPostCreate />
            <Separator className="my-6" />
          </>
        )}
        {hasPosts ? (
          <Posts selectedPostSlug={postSlug} />
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
