'use client';

import { getPostDescription } from '@/entities/post';
import { FILE_TYPES } from '@/entities/file';
import { Link } from '@/i18n/navigation';
import type { components } from '@/shared/api/openapi';
import { useGalleryContext } from '@/shared/lib/gallery';
import { BaseHtml } from '@/shared/ui/base-html';
import { Button } from '@/shared/ui/ds/button';
import { Card, CardContent, CardFooter } from '@/shared/ui/ds/card';
import { Separator } from '@/shared/ui/ds/separator';
import { Edit2, Share2 } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
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

/** Opens the native share sheet for a post and ignores deliberate cancellation. */
const PostShareButton = ({ postId }: { postId: components['schemas']['PostResponse']['_meta']['id'] }) => {
  const t = useTranslations('Post');

  const onClickShare = async () => {
    try {
      await globalThis.navigator.share({
        title: document.title,
        url: new URL(`/blog/${postId}`, globalThis.location.origin).toString(),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      throw error;
    }
  };

  return (
    <Button aria-label={t('share')} variant="secondary" onClick={onClickShare}>
      <Share2 />
    </Button>
  );
};

export const Post = ({
  post,
  selectedPostId,
  onClickAttachment,
  content,
  afterFooterButtons,
}: {
  post: components['schemas']['PostResponse'];
  selectedPostId: components['schemas']['PostResponse']['_meta']['id'] | null;
  onClickAttachment?: (attachment: components['schemas']['StoredFile']) => void;
  content?: ReactNode;
  afterFooterButtons?: ReactNode;
}) => {
  const t = useTranslations('Post');
  const { relativeTime } = useFormatter();
  const now = useNow();
  const { open, setOnClose } = useGalleryContext();
  const isSelected = selectedPostId === post._meta.id;
  const descriptionContent = getPostDescription(post.text);
  const description = descriptionContent ? t('postWithContent', { content: descriptionContent }) : t('post');
  const handleAttachmentClick = (attachment: components['schemas']['StoredFile']) => {
    if (onClickAttachment) {
      onClickAttachment(attachment);
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

  return (
    <article className="contents" aria-label={description}>
      <Card
        data-id={post._meta.id}
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
                      handleAttachmentClick(attachment);
                    }}
                  />
                );
              })}
            </>
          )}
        </CardContent>
        <footer className="contents">
          <CardFooter className="justify-between gap-2">
            <Link
              href={`/blog/${post._meta.id}`}
              className="hover:underline flex items-center gap-1 me-auto text-muted-foreground"
              target="_blank"
            >
              <time
                dateTime={new Date(post._meta.createdAt).toISOString()}
                title={new Date(post._meta.createdAt).toISOString()}
                className="contents"
                suppressHydrationWarning
              >
                {relativeTime(post._meta.createdAt, now)}
                {post._meta.updatedAt !== post._meta.createdAt && <Edit2 className="size-3.5" />}
              </time>
            </Link>
            <PostShareButton postId={post._meta.id} />
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
