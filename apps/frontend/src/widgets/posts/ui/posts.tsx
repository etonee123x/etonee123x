'use client';

import { useInfiniteQueryGetPosts } from '@/entities/post';
import { useIsAdminContext } from '@/entities/session/client';
import { DeletePostProvider } from '@/features/post/delete';
import { EditPostProvider } from '@/features/post/editor';
import type { components } from '@/shared/api/openapi';
import { Marker, MarkerContent } from '@/shared/ui/ds/marker';
import { Spinner } from '@/shared/ui/ds/spinner';
import { useGalleryContext } from '@/shared/lib/gallery';
import { FILE_TYPES } from '@/entities/file';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useLayoutEffect, useMemo, useRef, type ComponentProps } from 'react';
import { isNil } from '@/shared/utils/is-nil';
import { useWindowScrollPosition } from '@/shared/hooks/use-window-scroll-position';
import { EditablePost } from './editable-post';
import type { Post } from './post';

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
        <div className="flex flex-col gap-6">
          {isFetchingPreviousPage && <Spinner />}

          {posts.map((post) => {
            return <EditablePost key={post._meta.id} {...{ post, selectedPostId, onClickAttachment }} />;
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
