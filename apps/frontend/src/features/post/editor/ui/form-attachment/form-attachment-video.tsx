import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/ds/attachment';
import { type ComponentProps } from 'react';

export const FormAttachmentVideo = ({
  src,
  name,
  fileSize,
  onClickPreview,
  children,
  ...props
}: Pick<ComponentProps<'video'>, 'src'> & {
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
          <video
            src={src}
            preload="metadata"
            className="size-full object-contain"
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
