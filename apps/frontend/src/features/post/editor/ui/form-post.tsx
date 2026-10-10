'use client';

import { Button } from '@/shared/ui/ds/button';
import { Textarea } from '@/shared/ui/ds/textarea';
import { type components } from '@/shared/api/openapi';
import { FilePlus2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { FormPostAttachments } from './form-post-attachments';
import { throwError } from '@/shared/utils/throw-error';

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

  /** Normalize upload names before adding files to the controlled attachment model. */
  const addFiles = (files: Array<File>) => {
    const usedNames = new Set(
      modelFilesAndAttachments.map((attachment) => {
        return attachment.name;
      }),
    );
    const addedFiles = files.map((file) => {
      const namedFile = fileWithUniqueName(file, usedNames);
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
      {/* Keep the resource owner mounted even when the controlled list is cleared. */}
      <FormPostAttachments attachments={modelFilesAndAttachments} onChange={setModelFilesAndAttachments} />
    </form>
  );
};
