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
  children,
  ...props
}: Pick<ComponentProps<'video'>, 'src'> & {
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
} & ComponentProps<typeof Attachment>) => {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <video src={src} />
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
