'use client';

import { extensionToFileType } from '@/entities/file';
import type { components } from '@/shared/api/openapi';
import { Button } from '@/shared/ui/ds/button';
import { AttachmentAction } from '@/shared/ui/ds/attachment';
import { formatFileSize } from '@/shared/utils/format-file-size';
import { useGalleryContext, type GalleryItem } from '@/shared/lib/gallery';
import { arrayMove, arraySwap } from '@dnd-kit/helpers';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { cn } from 'cn';
import { ArrowDown, ArrowUp, Grip, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ComponentProps, type Dispatch, type SetStateAction, memo, useEffect, useReducer, useState } from 'react';
import { FormAttachment } from './form-attachment';

type Attachment = components['schemas']['StoredFile'];

/** Sortable identity does not change when an attachment moves. */
const attachmentKey = (attachment: File | Attachment) => {
  return attachment instanceof File
    ? [attachment.name, attachment.type, attachment.lastModified, attachment.size].join('-')
    : [attachment.name, attachment.src].join('-');
};

/** Keep local upload classification consistent between preview selection and gallery contents. */
const getAttachmentType = (attachment: File | Attachment) => {
  if (!(attachment instanceof File)) {
    return attachment.fileType;
  }

  const extension = /^[^/]+\/(?<extension>.+)$/.exec(attachment.type)?.groups?.extension ?? null;
  return extensionToFileType(extension);
};

/** Convert a marked preview element to gallery data using its intrinsic media dimensions. */
const elementToGalleryItem = (preview: Element): GalleryItem | null => {
  if (preview instanceof HTMLImageElement) {
    return {
      src: preview.currentSrc || preview.src,
      width: preview.naturalWidth,
      height: preview.naturalHeight,
      name: preview.dataset.attachmentName ?? '',
      type: 'image',
    };
  }

  if (preview instanceof HTMLVideoElement) {
    return {
      src: preview.currentSrc || preview.src,
      width: preview.videoWidth,
      height: preview.videoHeight,
      name: preview.dataset.attachmentName ?? '',
      type: 'video',
    };
  }

  return null;
};

const SortableFormAttachment = ({
  attachment,
  src,
  index,
  count,
  onRemove,
  onSwap,
  onClickPreview,
}: {
  attachment: File | Attachment;
  src: string;
  index: number;
  count: number;
  onRemove: (index: number) => void;
  onSwap: (index: number, direction: -1 | 1) => void;
  onClickPreview: ComponentProps<'button'>['onClick'];
}) => {
  const format = useFormatter();
  const t = useTranslations('FormPostAttachments');

  const { value, unit, maximumFractionDigits } = formatFileSize(attachment.size);
  const fileSize = t('fileSize', { value: format.number(value, { maximumFractionDigits }), unit });

  const preview = {
    src,
    name: attachment.name,
    type: getAttachmentType(attachment),
    fileSize,
  };

  const { handleRef, ref, isDragSource } = useSortable({ id: attachmentKey(attachment), index, data: preview });

  return (
    <FormAttachment
      {...preview}
      ref={ref}
      className={cn('w-full', isDragSource && 'invisible')}
      onClickPreview={onClickPreview}
    >
      {/* All list actions live here; media components only place the children slot. */}
      <AttachmentAction
        type="button"
        size="icon"
        aria-label={t('moveAttachmentUp')}
        title={t('moveAttachmentUp')}
        disabled={index === 0 || isDragSource}
        onClick={() => {
          onSwap(index, -1);
        }}
      >
        <ArrowUp />
      </AttachmentAction>
      <AttachmentAction
        type="button"
        size="icon"
        aria-label={t('moveAttachmentDown')}
        title={t('moveAttachmentDown')}
        disabled={index === count - 1 || isDragSource}
        onClick={() => {
          onSwap(index, 1);
        }}
      >
        <ArrowDown />
      </AttachmentAction>
      <AttachmentAction
        type="button"
        className="cursor-grab group-not-has-[>:nth-child(2)]/form-post-attachments:hidden"
        size="icon"
        ref={handleRef}
      >
        <Grip />
      </AttachmentAction>
      <AttachmentAction
        type="button"
        size="icon-sm"
        className="ms-2"
        variant="destructive"
        onClick={() => {
          onRemove(index);
        }}
      >
        <X />
      </AttachmentAction>
    </FormAttachment>
  );
};

/** Controlled attachment list owns ordering, removal and preview resources; the form owns only its model. */
export const FormPostAttachments = memo(function FormPostAttachments({
  attachments,
  onChange,
}: {
  attachments: Array<File | Attachment>;
  onChange: Dispatch<SetStateAction<Array<File | Attachment>>>;
}) {
  const t = useTranslations('FormPost');
  const [fileToPreviewSource] = useState(() => {
    return new Map<File, string>();
  });
  const [, refreshPreviews] = useReducer((version: number) => {
    return version + 1;
  }, 0);
  const { open, setOnClose } = useGalleryContext();

  // Allocate browser resources after commit, never during render or replayable model updaters.
  useEffect(() => {
    let added = false;
    for (const attachment of attachments) {
      if (attachment instanceof File && !fileToPreviewSource.has(attachment)) {
        fileToPreviewSource.set(attachment, URL.createObjectURL(attachment));
        added = true;
      }
    }
    for (const [file, source] of fileToPreviewSource) {
      if (!attachments.includes(file)) {
        URL.revokeObjectURL(source);
        fileToPreviewSource.delete(file);
      }
    }
    if (added) {
      refreshPreviews();
    }
  }, [attachments, fileToPreviewSource]);

  useEffect(() => {
    return () => {
      for (const source of fileToPreviewSource.values()) {
        URL.revokeObjectURL(source);
      }
      fileToPreviewSource.clear();
    };
  }, [fileToPreviewSource]);

  /** Swap neighboring objects without changing file identity or preview URLs. */
  const onSwap = (index: number, direction: -1 | 1) => {
    onChange((items) => {
      return arraySwap(items, index, index + direction);
    });
  };

  const onRemove = (index: number) => {
    onChange((items) => {
      return items.toSpliced(index, 1);
    });
  };

  const onDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'] = (event) => {
    const { source } = event.operation;
    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
      return;
    }

    // dnd-kit mutates its source after drop; capture indexes before React runs the updater.
    onChange((items) => {
      return arrayMove(items, source.initialIndex, source.index);
    });
  };

  if (attachments.length === 0) {
    return null;
  }

  /** Read gallery contents and intrinsic dimensions from current media elements. */
  const onClickPreview: ComponentProps<'button'>['onClick'] = ({ currentTarget }) => {
    const attachmentList = currentTarget.closest('[data-attachment-list]');
    if (!attachmentList) {
      return;
    }

    const clickedPreviewElement = currentTarget.querySelector('[data-attachment-preview]');
    const galleryItem = clickedPreviewElement && elementToGalleryItem(clickedPreviewElement);
    if (!galleryItem) {
      return;
    }

    const galleryItems = [...attachmentList.querySelectorAll('[data-attachment-preview]')].flatMap((preview) => {
      const item = elementToGalleryItem(preview);
      return item ? [item] : [];
    });

    setOnClose(null);
    open(galleryItem, galleryItems);
  };

  return (
    <div className="flex flex-col gap-2">
      <DragDropProvider onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-col group/form-post-attachments">
          {attachments.map((attachment, index) => {
            const source = attachment instanceof File ? fileToPreviewSource.get(attachment) : attachment.src;
            // A new upload becomes visible once its URL has been allocated by the effect.
            return source === undefined ? null : (
              <SortableFormAttachment
                key={attachmentKey(attachment)}
                attachment={attachment}
                src={source}
                index={index}
                count={attachments.length}
                onRemove={onRemove}
                onSwap={onSwap}
                onClickPreview={onClickPreview}
              />
            );
          })}
        </div>
        {/* No drop animation or placeholder: preserve the Safari-compatible drag behavior. */}
        <DragOverlay className="empty:hidden" dropAnimation={null}>
          {(source) => {
            return (
              <FormAttachment
                {...(source.data as ComponentProps<typeof FormAttachment>)}
                ref={undefined}
                className="w-full"
              />
            );
          }}
        </DragOverlay>
      </DragDropProvider>
      <Button
        type="button"
        className="self-end"
        size="sm"
        variant="ghost"
        onClick={() => {
          onChange([]);
        }}
      >
        {t('clearAll')}
        <X />
      </Button>
    </div>
  );
});
