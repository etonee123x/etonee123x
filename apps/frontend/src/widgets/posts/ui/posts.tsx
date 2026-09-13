'use client';

import { getPostDescription, useInfiniteQueryGetPosts, useMutationPatchPostById } from '@/entities/post';
import { useIsAdminContext } from '@/entities/session/client';
import { DeletePostProvider, useDeletePostContext } from '@/features/post/delete';
import { EditPostProvider, FormPost, useEditPostContext, type FormPostRef } from '@/features/post/editor';
import { Link, useRouter } from '@/i18n/navigation';
import type { components } from '@/shared/api/openapi';
import { BaseHtml } from '@/shared/ui/base-html';
import { Button } from '@/shared/ui/ds/button';
import { Card, CardContent, CardFooter } from '@/shared/ui/ds/card';
import { Marker, MarkerContent } from '@/shared/ui/ds/marker';
import { Spinner } from '@/shared/ui/ds/spinner';
import { useGalleryContext } from '@/shared/lib/gallery';
import { FILE_TYPES } from '@/entities/file';
import { Check, Edit2, Trash2, X } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { isNil } from '@/shared/utils/is-nil';
import { useWindowScrollPosition } from '@/shared/hooks/use-window-scroll-position';
import { cn } from '@/shared/utils/cn';
import { PostAttachment } from './post-attachment/post-attachment';
import { toast } from '@/shared/ui/ds/toast';

const isAttachmentGalleryItem = (attachment: components['schemas']['PostResponse']['attachments'][number]) => {
  return attachment.fileType === FILE_TYPES.IMAGE || attachment.fileType === FILE_TYPES.VIDEO;
};

const attachmentGalleryItemToGalleryItem = (
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

const DialogDeletePost = dynamic(() => {
  return import('@/features/post/delete').then((module) => {
    return module.DialogDeletePost;
  });
});

const Post = ({
  post,
  selectedPostId,
  onClickAttachment,
}: {
  post: components['schemas']['PostResponse'];
  selectedPostId: components['schemas']['PostResponse']['_meta']['id'] | null;
  onClickAttachment: (attachment: components['schemas']['StoredFile']) => void;
}) => {
  const t = useTranslations('Post');

  const router = useRouter();

  const { postId, enterEditPostById, exitEditPost } = useEditPostContext();
  const { requestDeletePostById } = useDeletePostContext();

  const { isAdmin } = useIsAdminContext();

  const { relativeTime } = useFormatter();
  const now = useNow();
  const formPostRef = useRef<FormPostRef>(null);
  const [isEditFormValid, setIsEditFormValid] = useState(false);
  const formPostId = `form-update-post-${post._meta.id}`;

  const isEditing = postId === post._meta.id;
  const isSelected = selectedPostId === post._meta.id;
  // Match the post's accessible name with its metadata description.
  const content = getPostDescription(post.text);
  const description = content ? t('postWithContent', { content }) : t('post');

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    formPostRef.current?.focusTextarea();
  }, [isEditing]);

  const onSubmitWithoutChanges = () => {
    exitEditPost();
  };

  const onValidityChange: ComponentProps<typeof FormPost>['onValidityChange'] = (isValid) => {
    setIsEditFormValid(isValid);
  };

  const mutationPatchPostById = useMutationPatchPostById();

  const onSubmit: ComponentProps<typeof FormPost>['onSubmit'] = async (...[, _post, files]) => {
    try {
      await mutationPatchPostById.mutateAsync({
        id: post._meta.id,
        data: _post,
        files,
      });
    } catch (error) {
      toast.add({ description: t('couldNotSendPost'), type: 'error' });
      throw error;
    }

    exitEditPost();

    router.push('/blog', { scroll: false });
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
          {isEditing ? (
            <FormPost
              id={formPostId}
              ref={formPostRef}
              defaultValues={{
                text: post.text,
                attachments: post.attachments,
              }}
              {...{
                post,
                onValidityChange,
                onSubmitWithoutChanges,
                onSubmit,
              }}
            />
          ) : (
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
              <Link
                href={`/blog/${post._meta.id}`}
                className="self-end hover:underline flex items-center gap-1 text-muted-foreground"
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
            </>
          )}
        </CardContent>

        {isAdmin && (
          <CardFooter className="justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  key="confirm"
                  aria-label={t('confirm')}
                  title={t('confirm')}
                  type="submit"
                  form={formPostId}
                  disabled={!isEditFormValid}
                >
                  <Check />
                </Button>
                <Button
                  key="cancel"
                  onClick={() => {
                    exitEditPost();
                  }}
                  aria-label={t('cancel')}
                  title={t('cancel')}
                  variant="secondary"
                >
                  <X />
                </Button>
              </>
            ) : (
              <>
                <Button
                  key="edit"
                  aria-label={t('edit')}
                  onClick={() => {
                    enterEditPostById(post._meta.id);
                  }}
                  title={t('edit')}
                  variant="secondary"
                >
                  <Edit2 />
                </Button>
                <Button
                  key="delete"
                  aria-label={t('delete')}
                  onClick={() => {
                    requestDeletePostById(post._meta.id);
                  }}
                  title={t('delete')}
                  variant="destructive"
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </article>
  );
};

export const Posts = ({
  selectedPostId,
}: {
  selectedPostId: components['schemas']['PostResponse']['_meta']['id'] | null;
}) => {
  const t = useTranslations('Post');
  const { isAdmin } = useIsAdminContext();

  const scrollRestoreRef = useRef<{
    scrollTop: number;
    scrollHeight: number;
  } | null>(null);

  const { open, setOnClose } = useGalleryContext();

  const {
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    data: infiniteQueryGetPostsData,
  } = useInfiniteQueryGetPosts(selectedPostId);

  const posts = useMemo(() => {
    return (
      infiniteQueryGetPostsData?.pages.flatMap((page) => {
        return page.rows;
      }) ?? []
    );
  }, [infiniteQueryGetPostsData]);

  useLayoutEffect(() => {
    const scrollRestoreRefCurrent = scrollRestoreRef.current;

    if (!scrollRestoreRefCurrent) {
      return;
    }

    const scrollingElement = document.scrollingElement;

    if (!scrollingElement) {
      return;
    }

    scrollingElement.scrollTop =
      scrollRestoreRefCurrent.scrollTop + scrollingElement.scrollHeight - scrollRestoreRefCurrent.scrollHeight;

    scrollRestoreRef.current = null;
  }, [posts.length]);

  useWindowScrollPosition(
    async (direction) => {
      if (direction === 'top' && hasPreviousPage && !isFetchingPreviousPage) {
        await fetchPreviousPage();
        scrollRestoreRef.current = document.scrollingElement
          ? {
              scrollTop: document.scrollingElement.scrollTop,
              scrollHeight: document.scrollingElement.scrollHeight,
            }
          : null;
      } else if (direction === 'bottom' && hasNextPage && !isFetchingNextPage) {
        await fetchNextPage();
      }
    },
    {
      offset: globalThis.innerHeight / 2,
    },
  );

  useLayoutEffect(() => {
    if (isNil(selectedPostId)) {
      return;
    }

    globalThis.document.querySelector(`[data-id="${CSS.escape(selectedPostId)}"]`)?.scrollIntoView({
      block: 'center',
    });
  }, [selectedPostId]);

  const onClickAttachment: ComponentProps<typeof Post>['onClickAttachment'] = (attachment) => {
    if (!isAttachmentGalleryItem(attachment)) {
      return;
    }

    setOnClose(null);

    open(
      attachmentGalleryItemToGalleryItem(attachment),
      posts.flatMap((post) => {
        return post.attachments.flatMap((attachment) => {
          return isAttachmentGalleryItem(attachment) ? [attachmentGalleryItemToGalleryItem(attachment)] : [];
        });
      }),
    );
  };

  return (
    <DeletePostProvider>
      <EditPostProvider>
        <div className="mb-6 flex flex-col gap-6">
          {isFetchingPreviousPage && <Spinner />}

          {posts.map((post) => {
            return <Post key={post._meta.id} {...{ post, selectedPostId, onClickAttachment }} />;
          })}

          {isFetchingNextPage && <Spinner />}

          {!hasNextPage && posts.length > 0 && (
            <Marker variant="separator">
              <MarkerContent>{t('thereAreNoMorePosts')}</MarkerContent>
            </Marker>
          )}
        </div>
        {isAdmin && <DialogDeletePost />}
      </EditPostProvider>
    </DeletePostProvider>
  );
};
