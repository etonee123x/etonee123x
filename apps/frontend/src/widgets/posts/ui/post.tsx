'use client';

import { usePostDescription } from '@/entities/post';
import { FILE_TYPES } from '@/entities/file';
import { share, ShareButton } from '@/features/share';
import { Link } from '@/i18n/navigation';
import type { components } from '@/shared/api/openapi';
import { useGalleryContext } from '@/shared/lib/gallery';
import { BaseHtml } from '@/shared/ui/base-html';
import { Card, CardContent, CardFooter } from '@/shared/ui/ds/card';
import { Separator } from '@/shared/ui/ds/separator';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { PostAttachment } from './post-attachment/post-attachment';

const isGalleryAttachment = (attachment: components['schemas']['StoredFile']) => {
  return attachment.fileType === FILE_TYPES.IMAGE || attachment.fileType === FILE_TYPES.VIDEO;
};

const toGalleryItem = (
  attachment: components['schemas']['StoredFileVideo'] | components['schemas']['StoredFileImage'],
) => {
  return {
    src: attachment.src,
    width: attachment.metadata.width,
    height: attachment.metadata.height,
    name: attachment.name,
    type: attachment.fileType === FILE_TYPES.IMAGE ? 'image' : 'video',
  } as const;
};

export const Post = ({
  post,
  selectedPostSlug,
  onClickAttachment: _onClickAttachment,
  content,
  afterFooterButtons,
}: {
  post: components['schemas']['PostResponse'];
  selectedPostSlug: components['schemas']['PostResponse']['slug'] | null;
  onClickAttachment?: (attachment: components['schemas']['StoredFile']) => void;
  content?: ReactNode;
  afterFooterButtons?: ReactNode;
}) => {
  const description = usePostDescription(post);
  const t = useTranslations('Post');

  const { relativeTime } = useFormatter();
  // eslint-disable-next-line react-hooks/purity -- Relative timestamps need the current clock on each render.
  const now = Date.now();

  const { open, setOnClose } = useGalleryContext();

  const isSelected = selectedPostSlug === post.slug;

  const onClickAttachment = (attachment: components['schemas']['StoredFile']) => {
    if (_onClickAttachment) {
      _onClickAttachment(attachment);
      return;
    }

    if (!isGalleryAttachment(attachment)) {
      return;
    }

    setOnClose(null);

    open(
      toGalleryItem(attachment),
      post.attachments.flatMap((postAttachment) => {
        return isGalleryAttachment(postAttachment) ? [toGalleryItem(postAttachment)] : [];
      }),
    );
  };

  const onClickShareButton = () => {
    return share({
      title: globalThis.document.title,
      url: new URL(`/blog/${post.slug}`, globalThis.location.origin).toString(),
      text: post.text || undefined,
    });
  };

  return (
    <article className="contents" aria-label={description}>
      <Card
        data-slug={post.slug}
        className={cn(
          isSelected &&
            "relative animate-post-highlight after:content-[''] after:absolute after:-inset-1.5 after:rounded-xl after:bg-primary/60 after:animate-post-fade after:-z-10",
        )}
      >
        <CardContent className="flex flex-col gap-2">
          {content ?? (
            <>
              {post.text && <BaseHtml html={post.text} />}
              {post.attachments.map((attachment, index) => {
                return (
                  <PostAttachment
                    key={index}
                    attachment={attachment}
                    index={index}
                    onClick={() => {
                      onClickAttachment(attachment);
                    }}
                  />
                );
              })}
            </>
          )}
        </CardContent>
        <footer className="contents">
          <CardFooter className="justify-between gap-2">
            {/* TODO: Replace relative post timestamps with absolute localized dates. */}
            <Link
              href={`/blog/${post.slug}`}
              className="hover:underline me-auto flex flex-col text-muted-foreground"
              target="_blank"
            >
              <time
                dateTime={new Date(post._meta.createdAt).toISOString()}
                title={new Date(post._meta.createdAt).toISOString()}
                className="contents"
                suppressHydrationWarning
              >
                {relativeTime(post._meta.createdAt, now)}
              </time>
              {post._meta.updatedAt !== post._meta.createdAt && (
                // Keep edit time separate from publication time for semantic datetime values.
                <time
                  dateTime={new Date(post._meta.updatedAt).toISOString()}
                  title={new Date(post._meta.updatedAt).toISOString()}
                  className="inline-flex items-center"
                  suppressHydrationWarning
                >
                  {t('editedAgo', { time: relativeTime(post._meta.updatedAt, now) })}
                </time>
              )}
            </Link>
            <ShareButton onClick={onClickShareButton} variant="secondary" />
            {afterFooterButtons && (
              <>
                <Separator orientation="vertical" className="h-6 my-auto" />
                {afterFooterButtons}
              </>
            )}
          </CardFooter>
        </footer>
      </Card>
    </article>
  );
};
