import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/ds/attachment';
import { FileQuestionMark } from 'lucide-react';
import { type ComponentProps } from 'react';

export const FormAttachmentUnknown = ({
  name,
  fileSize,
  children,
  ...props
}: {
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
} & ComponentProps<typeof Attachment>) => {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <FileQuestionMark className="size-6" />
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
