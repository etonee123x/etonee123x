import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/ds/attachment';
import { Grip, X } from 'lucide-react';
import Image from 'next/image';
import { type ComponentProps } from 'react';

export const FormAttachmentImage = ({
  src,
  name,
  fileSize,
  onClickRemove,
  handleRef,
  ...props
}: Pick<ComponentProps<typeof Image>, 'src'> & {
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
  onClickRemove: ComponentProps<typeof AttachmentAction>['onClick'];
  handleRef: ComponentProps<typeof AttachmentAction>['ref'];
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
        <AttachmentAction
          className="cursor-grab group-not-has-[>:nth-child(2)]/form-post-attachments:hidden"
          size="icon"
          ref={handleRef}
        >
          <Grip />
        </AttachmentAction>
        <AttachmentAction size="icon-sm" className="ms-2" variant="destructive" onClick={onClickRemove}>
          <X />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
};
