import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/ds/attachment';
import Image from 'next/image';
import { type ComponentProps } from 'react';

export const FormAttachmentImage = ({
  src,
  name,
  fileSize,
  onClickPreview,
  children,
  ...props
}: Pick<ComponentProps<typeof Image>, 'src'> & {
  name: string;
  fileSize: string;
  onClickPreview?: ComponentProps<'button'>['onClick'];
} & Omit<ComponentProps<typeof Attachment>, 'onClick'>) => {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <button
          type="button"
          className="flex size-full cursor-zoom-in items-center justify-center"
          aria-label={name}
          onClick={onClickPreview}
        >
          <Image
            width={40}
            height={40}
            className="h-full w-full object-contain"
            src={src}
            alt=""
            data-attachment-preview
            data-attachment-name={name}
          />
        </button>
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
        <AttachmentDescription>{fileSize}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        {/* Controls are composed once by FormAttachment, independently of the media type. */}
        {children}
      </AttachmentActions>
    </Attachment>
  );
};
