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
  children,
  ...props
}: Pick<ComponentProps<typeof Image>, 'src'> & {
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
} & ComponentProps<typeof Attachment>) => {
  return (
    <Attachment {...props}>
      <AttachmentMedia>
        <Image width={40} height={40} className="h-full w-full object-contain" src={src} alt="" />
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
