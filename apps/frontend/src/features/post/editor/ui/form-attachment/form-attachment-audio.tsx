import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/ds/attachment';
import { Music } from 'lucide-react';
import { type ComponentProps } from 'react';

export const FormAttachmentAudio = ({
  src,
  name,
  fileSize,
  children,
  ...props
}: Pick<ComponentProps<'audio'>, 'src'> & {
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
} & ComponentProps<typeof Attachment>) => {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <Music />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
        <AttachmentDescription>{fileSize}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        {/* Controls are composed once by FormAttachment, independently of the media type. */}
        {children}
      </AttachmentActions>
      <audio src={src} controls className="w-full" />
    </Attachment>
  );
};
