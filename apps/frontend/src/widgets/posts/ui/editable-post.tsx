'use client';

import { useMutationPatchPostById } from '@/entities/post';
import { useIsAdminContext } from '@/entities/session/client';
import { useDeletePostContext } from '@/features/post/delete';
import { FormPost, useEditPostContext, type FormPostRef } from '@/features/post/editor';
import { useRouter } from '@/i18n/navigation';
import type { components } from '@/shared/api/openapi';
import { Button } from '@/shared/ui/ds/button';
import { Check, Edit2, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { toast } from '@/shared/ui/ds/toast';
import { Post } from './post';

export const EditablePost = ({
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
  const mutationPatchPostById = useMutationPatchPostById();
  const formPostRef = useRef<FormPostRef>(null);
  const [isEditFormValid, setIsEditFormValid] = useState(false);
  const formPostId = `form-update-post-${post._meta.id}`;
  const isEditing = postId === post._meta.id;

  useEffect(() => {
    if (isEditing) {
      formPostRef.current?.focusTextarea();
    }
  }, [isEditing]);

  const onSubmit: ComponentProps<typeof FormPost>['onSubmit'] = async (...[, updatedPost, files]) => {
    try {
      await mutationPatchPostById.mutateAsync({ id: post._meta.id, data: updatedPost, files });
    } catch (error) {
      toast.add({ description: t('couldNotSendPost'), type: 'error' });
      throw error;
    }

    exitEditPost();
    router.push('/blog', { scroll: false });
  };

  const adminActions = (() => {
    if (!isAdmin) {
      return null;
    }

    if (isEditing) {
      return (
        <>
          <Button
            aria-label={t('confirm')}
            title={t('confirm')}
            type="submit"
            form={formPostId}
            disabled={!isEditFormValid}
          >
            <Check />
          </Button>
          <Button aria-label={t('cancel')} title={t('cancel')} variant="secondary" onClick={exitEditPost}>
            <X />
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          aria-label={t('edit')}
          title={t('edit')}
          variant="secondary"
          onClick={() => {
            enterEditPostById(post._meta.id);
          }}
        >
          <Edit2 />
        </Button>
        <Button
          aria-label={t('delete')}
          title={t('delete')}
          variant="destructive"
          onClick={() => {
            requestDeletePostById(post._meta.id);
          }}
        >
          <Trash2 />
        </Button>
      </>
    );
  })();

  return (
    <Post
      post={post}
      selectedPostId={selectedPostId}
      onClickAttachment={onClickAttachment}
      afterFooterButtons={adminActions}
      content={
        isEditing ? (
          <FormPost
            id={formPostId}
            ref={formPostRef}
            defaultValues={{ text: post.text, attachments: post.attachments }}
            onValidityChange={setIsEditFormValid}
            onSubmitWithoutChanges={exitEditPost}
            onSubmit={onSubmit}
          />
        ) : undefined
      }
    />
  );
};
