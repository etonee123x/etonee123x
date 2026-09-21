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
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { extensionToFileType, FILE_TYPES } from '@/entities/file';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { FormAttachment } from './form-attachment';
import { throwError } from '@/shared/utils/throw-error';
import { formatFileSize } from '@/shared/utils/format-file-size';

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
  onClickRemoveByIndex,
}: {
  id: string;
  index: number;
  fileOrAttachment: FileOrAttachment;
  onClickRemoveByIndex: (index: number) => void;
}) => {
  const { handleRef, ref } = useSortable({ id, index });
  const [fileObjectUrl] = useState(() => {
    return fileOrAttachment instanceof File ? URL.createObjectURL(fileOrAttachment) : undefined;
  });

  useEffect(() => {
    return () => {
      if (fileObjectUrl) {
        URL.revokeObjectURL(fileObjectUrl);
      }
    };
  }, [fileObjectUrl]);

  const source = fileOrAttachment instanceof File ? fileObjectUrl : fileOrAttachment.src;
  const format = useFormatter();
  const t = useTranslations('FormPostAttachments');

  if (!source) {
    return null;
  }

  const { value, unit, maximumFractionDigits } = formatFileSize(fileOrAttachment.size);
  const fileSize = t('fileSize', { value: format.number(value, { maximumFractionDigits }), unit });

  return (
    <FormAttachment
      ref={ref}
      handleRef={handleRef}
      src={source}
      type={fileOrAttachmentToType(fileOrAttachment)}
      name={fileOrAttachment.name}
      fileSize={fileSize}
      onClickRemove={() => {
        onClickRemoveByIndex(index);
      }}
      className="w-full"
    />
  );
};

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

  const onChangeInputFiles: ComponentProps<'input'>['onChange'] = (event) => {
    const files = [...(event.currentTarget.files ?? [])];

    if (files.length === 0) {
      return;
    }

    setModelFilesAndAttachments((modelFilesAndAttachments) => {
      const usedNames = new Set(
        modelFilesAndAttachments.map((fileOrAttachment) => {
          return fileOrAttachment.name;
        }),
      );

      return [
        ...modelFilesAndAttachments,
        ...files.map((file) => {
          return fileWithUniqueName(file, usedNames);
        }),
      ];
    });

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
    setModelFilesAndAttachments((modelFilesAndAttachments) => {
      const usedNames = new Set(
        modelFilesAndAttachments.map((fileOrAttachment) => {
          return fileOrAttachment.name;
        }),
      );

      return [
        ...modelFilesAndAttachments,
        ...files.map((file) => {
          return fileWithUniqueName(file, usedNames);
        }),
      ];
    });
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

  const onClickDeleteFiles = () => {
    setModelFilesAndAttachments([]);
  };

  const onClickRemoveByIndex = (index: number) => {
    setModelFilesAndAttachments((modelFilesAndAttachments) => {
      return modelFilesAndAttachments.toSpliced(index, 1);
    });
  };

  const onDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'] = (event) => {
    const { source } = event.operation;

    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
      return;
    }

    setModelFilesAndAttachments((modelFilesAndAttachments) => {
      return modelFilesAndAttachments
        .toSpliced(source.initialIndex, 1)
        .toSpliced(source.index, 0, modelFilesAndAttachments[source.initialIndex] ?? throwError());
    });
  };

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
          <DragDropProvider onDragEnd={onDragEnd}>
            <div className="flex gap-4 flex-col group/form-post-attachments">
              {modelFilesAndAttachments.map((fileOrAttachment, index) => {
                return (
                  <SortableFormAttachment
                    id={fileOrAttachmentToKey(fileOrAttachment)}
                    index={index}
                    key={fileOrAttachmentToKey(fileOrAttachment)}
                    fileOrAttachment={fileOrAttachment}
                    onClickRemoveByIndex={onClickRemoveByIndex}
                  />
                );
              })}
            </div>
          </DragDropProvider>
          <Button className="self-end" size="sm" variant="ghost" onClick={onClickDeleteFiles}>
            {t('clearAll')}
            <X />
          </Button>
        </div>
      )}
    </form>
  );
};
