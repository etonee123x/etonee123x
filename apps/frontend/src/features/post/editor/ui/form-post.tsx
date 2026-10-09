'use client';

import { Button } from '@/shared/ui/ds/button';
import { Textarea } from '@/shared/ui/ds/textarea';
import { type components } from '@/shared/api/openapi';
import { FilePlus2, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  type ComponentProps,
  type ComponentRef,
  type HTMLProps,
  type Ref,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { extensionToFileType, FILE_TYPES } from '@/entities/file';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { FormAttachment } from './form-attachment';
import { throwError } from '@/shared/utils/throw-error';
import { formatFileSize } from '@/shared/utils/format-file-size';
import { cn } from 'cn';

type Post = Omit<components['schemas']['PostUpdateRequest'], 'files'>;
type Attachment = NonNullable<Post['attachments'][number]>;
type FileOrAttachment = File | Attachment;

const onKeyDownTextarea: ComponentProps<typeof Textarea>['onKeyDown'] = (event) => {
  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
    return;
  }

  if (navigator.maxTouchPoints !== 0) {
    return;
  }

  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
};
const fileOrAttachmentToKey = (fileOrAttachment: FileOrAttachment) => {
  return fileOrAttachment instanceof File
    ? [fileOrAttachment.name, fileOrAttachment.type, fileOrAttachment.lastModified, fileOrAttachment.size].join('-')
    : [fileOrAttachment.name, fileOrAttachment.src].join('-');
};

const fileWithUniqueName = (file: File, usedNames: Set<string>) => {
  const extensionStart = file.name.lastIndexOf('.');
  const baseName = extensionStart > 0 ? file.name.slice(0, extensionStart) : file.name;
  const extension = extensionStart > 0 ? file.name.slice(extensionStart) : '';
  let index = 0;
  let name = file.name;

  while (usedNames.has(name)) {
    name = `${baseName} (${++index})${extension}`;
  }

  usedNames.add(name);

  return name === file.name ? file : new File([file], name, { type: file.type, lastModified: file.lastModified });
};

const fileOrAttachmentToType = (fileOrAttachment: FileOrAttachment) => {
  if (!(fileOrAttachment instanceof File)) {
    return fileOrAttachment.fileType;
  }

  const extension = /^[^/]+\/(?<extension>.+)$/.exec(fileOrAttachment.type)?.groups?.extension;

  return extension ? (extensionToFileType(`.${extension}`) ?? FILE_TYPES.UNKNOWN) : FILE_TYPES.UNKNOWN;
};

const SortableFormAttachment = ({
  id,
  index,
  fileOrAttachment,
  src,
  onClickRemoveByIndex,
}: {
  id: string;
  index: number;
  fileOrAttachment: FileOrAttachment;
  src: string;
  onClickRemoveByIndex: (index: number) => void;
}) => {
  const format = useFormatter();
  const t = useTranslations('FormPostAttachments');
  const { value, unit, maximumFractionDigits } = formatFileSize(fileOrAttachment.size);
  // Preview props travel as sortable data so `DragOverlay` can render the same attachment.
  const preview = {
    src,
    type: fileOrAttachmentToType(fileOrAttachment),
    name: fileOrAttachment.name,
    fileSize: t('fileSize', { value: format.number(value, { maximumFractionDigits }), unit }),
  };
  const { handleRef, ref, isDragSource } = useSortable({ id, index, data: preview });

  if (!src) {
    return null;
  }

  return (
    <FormAttachment
      ref={ref}
      handleRef={handleRef}
      {...preview}
      onClickRemove={() => {
        onClickRemoveByIndex(index);
      }}
      // The overlay shows the dragged copy; the original only keeps its slot.
      className={cn('w-full', isDragSource && 'invisible')}
    />
  );
};

// Keep drag-and-drop previews mounted and out of text-only form renders.
const FormPostAttachments = memo(function FormPostAttachments({
  attachments,
  fileToPreviewSrc,
  onClickRemoveByIndex,
  onDragEnd,
}: {
  attachments: Array<FileOrAttachment>;
  fileToPreviewSrc: Map<File, string>;
  onClickRemoveByIndex: (index: number) => void;
  onDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'];
}) {
  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div className="flex gap-4 flex-col group/form-post-attachments">
        {attachments.map((fileOrAttachment, index) => {
          return (
            <SortableFormAttachment
              id={fileOrAttachmentToKey(fileOrAttachment)}
              index={index}
              key={fileOrAttachmentToKey(fileOrAttachment)}
              fileOrAttachment={fileOrAttachment}
              src={
                fileOrAttachment instanceof File
                  ? (fileToPreviewSrc.get(fileOrAttachment) ?? throwError())
                  : fileOrAttachment.src
              }
              onClickRemoveByIndex={onClickRemoveByIndex}
            />
          );
        })}
      </div>
      {/* Overlay keeps the list item a plain in-flow element (no popover/placeholder), which Safari lays out wrong on drop. */}
      {/* No drop animation: Safari animates the overlay towards a stale position. */}
      <DragOverlay className="empty:hidden" dropAnimation={null}>
        {(source) => {
          return (
            <FormAttachment
              {...(source.data as ComponentProps<typeof FormAttachment>)}
              ref={undefined}
              handleRef={undefined}
              onClickRemove={undefined}
              className="w-full"
            />
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
});

export interface FormPostRef {
  focusTextarea: () => void;
}

export const FormPost = ({
  defaultValues = { text: '', attachments: [] },
  onSubmit,
  onSubmitWithoutChanges,
  onValidityChange,
  ref,
  ...props
}: Omit<
  //
  HTMLProps<HTMLFormElement>,
  'onSubmit' | 'ref'
> & {
  ref?: Ref<FormPostRef>;
  defaultValues?: { text: string; attachments: Array<Attachment> };
  onSubmit: (event: SubmitEvent, post: Post, files: Array<File>) => void | Promise<void>;
  onSubmitWithoutChanges?: (event: SubmitEvent) => void;
  onValidityChange?: (isValid: boolean) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<ComponentRef<typeof Textarea>>(null);

  const [modelText, setModelText] = useState(defaultValues.text);
  const [modelFilesAndAttachments, setModelFilesAndAttachments] = useState<Array<FileOrAttachment>>(
    defaultValues.attachments,
  );
  // File identity keeps previews stable across reorders and sortable remounts.
  const [fileToPreviewSource] = useState(() => {
    return new Map<File, string>();
  });

  // Release only removed uploads after commit; reordering retains every existing URL.
  useEffect(() => {
    for (const [file, url] of fileToPreviewSource) {
      if (!modelFilesAndAttachments.includes(file)) {
        URL.revokeObjectURL(url);
        fileToPreviewSource.delete(file);
      }
    }
  }, [modelFilesAndAttachments, fileToPreviewSource]);

  // Unmount also releases pending uploads; StrictMode's initial replay has no uploaded URLs.
  useEffect(() => {
    return () => {
      for (const url of fileToPreviewSource.values()) {
        URL.revokeObjectURL(url);
      }

      fileToPreviewSource.clear();
    };
  }, [fileToPreviewSource]);

  const isValid = modelText.length > 0 || modelFilesAndAttachments.length > 0;
  const isChanged =
    modelText !== defaultValues.text ||
    modelFilesAndAttachments.length !== defaultValues.attachments.length ||
    modelFilesAndAttachments.some((fileOrAttachment, index) => {
      if (fileOrAttachment instanceof File) {
        return true;
      }

      return (
        fileOrAttachmentToKey(fileOrAttachment) !==
        fileOrAttachmentToKey(defaultValues.attachments[index] ?? throwError())
      );
    });

  const t = useTranslations('FormPost');

  const focusTextareaAtEnd = () => {
    if (textareaRef.current === null) {
      return;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
  };

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  useImperativeHandle(ref, () => {
    return {
      focusTextarea: () => {
        focusTextareaAtEnd();
      },
    };
  }, []);

  const onClickButtonAddAttachment = () => {
    inputRef.current?.click();
  };

  /** Allocate once per added file outside React updaters, which StrictMode may replay. */
  const addFiles = (files: Array<File>) => {
    const usedNames = new Set(
      modelFilesAndAttachments.map((attachment) => {
        return attachment.name;
      }),
    );
    const addedFiles = files.map((file) => {
      const namedFile = fileWithUniqueName(file, usedNames);
      fileToPreviewSource.set(namedFile, URL.createObjectURL(namedFile));
      return namedFile;
    });

    setModelFilesAndAttachments((attachments) => {
      return [...attachments, ...addedFiles];
    });
  };

  const onChangeInputFiles: ComponentProps<'input'>['onChange'] = (event) => {
    const files = [...(event.currentTarget.files ?? [])];

    if (files.length === 0) {
      return;
    }

    addFiles(files);

    event.currentTarget.value = '';
  };

  const onPasteTextarea: ComponentProps<typeof Textarea>['onPaste'] = (event) => {
    const files = [...event.clipboardData.items]
      .map((item) => {
        return item.getAsFile();
      })
      .filter((file): file is File => {
        return file !== null;
      });

    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    addFiles(files);
  };

  const _onSubmit: ComponentProps<'form'>['onSubmit'] = async (event) => {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    if (!isChanged) {
      onSubmitWithoutChanges?.(event.nativeEvent);
      return;
    }

    try {
      await onSubmit(
        event.nativeEvent,
        {
          text: modelText,
          attachments: modelFilesAndAttachments.map((fileOrAttachment) => {
            return fileOrAttachment instanceof File ? null : fileOrAttachment;
          }),
        },
        modelFilesAndAttachments.filter((fileOrAttachment): fileOrAttachment is File => {
          return fileOrAttachment instanceof File;
        }),
      );
    } catch {
      return;
    }

    setModelText(defaultValues.text);
    setModelFilesAndAttachments(defaultValues.attachments);
    focusTextareaAtEnd();
  };

  const onClickDeleteFiles = useCallback(() => {
    setModelFilesAndAttachments([]);
  }, []);

  const onClickRemoveByIndex = useCallback((index: number) => {
    setModelFilesAndAttachments((attachments) => {
      return attachments.toSpliced(index, 1);
    });
  }, []);

  const onDragEnd = useCallback<NonNullable<ComponentProps<typeof DragDropProvider>['onDragEnd']>>((event) => {
    const { source } = event.operation;

    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
      return;
    }

    // Snapshot mutable dnd-kit indexes before React runs the updater.
    const { initialIndex, index } = source;
    setModelFilesAndAttachments((attachments) => {
      return attachments.toSpliced(initialIndex, 1).toSpliced(index, 0, attachments[initialIndex] ?? throwError());
    });
  }, []);

  return (
    <form {...props} className="flex flex-col gap-4" onSubmit={_onSubmit}>
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          aria-label={t('message')}
          placeholder={t('message')}
          value={modelText}
          onChange={(event) => {
            setModelText(event.target.value);
          }}
          onKeyDown={onKeyDownTextarea}
          onPaste={onPasteTextarea}
        />
        <div className="sticky top-[calc(var(--spacing-header-height)+var(--spacing)*2)] flex flex-col gap-2 h-min">
          <Button className="h-auto p-2" onClick={onClickButtonAddAttachment}>
            <FilePlus2 className="size-8" />
          </Button>
          <input ref={inputRef} tabIndex={-1} multiple type="file" className="sr-only" onChange={onChangeInputFiles} />
        </div>
      </div>
      {modelFilesAndAttachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <FormPostAttachments
            attachments={modelFilesAndAttachments}
            fileToPreviewSrc={fileToPreviewSource}
            onClickRemoveByIndex={onClickRemoveByIndex}
            onDragEnd={onDragEnd}
          />
          <Button className="self-end" size="sm" variant="ghost" onClick={onClickDeleteFiles}>
            {t('clearAll')}
            <X />
          </Button>
        </div>
      )}
    </form>
  );
};
