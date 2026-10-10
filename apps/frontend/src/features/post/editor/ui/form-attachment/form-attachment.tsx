import type { Attachment, AttachmentTitle } from '@/shared/ui/ds/attachment';
import { FILE_TYPES } from '@/entities/file';
import { checkExhaustive } from '@/shared/utils/check-exhaustive';
import dynamic from 'next/dynamic';
import { type ComponentProps } from 'react';

const FormAttachmentAudio = dynamic(() => {
  return import('./form-attachment-audio').then((module) => {
    return module.FormAttachmentAudio;
  });
});

const FormAttachmentImage = dynamic(() => {
  return import('./form-attachment-image').then((module) => {
    return module.FormAttachmentImage;
  });
});

const FormAttachmentVideo = dynamic(() => {
  return import('./form-attachment-video').then((module) => {
    return module.FormAttachmentVideo;
  });
});

const FormAttachmentUnknown = dynamic(() => {
  return import('./form-attachment-unknown').then((module) => {
    return module.FormAttachmentUnknown;
  });
});

export const FormAttachment = ({
  type,
  ...props
}: {
  type: (typeof FILE_TYPES)[keyof typeof FILE_TYPES];
  src: string;
  name: ComponentProps<typeof AttachmentTitle>['children'];
  fileSize: string;
} & Pick<ComponentProps<typeof Attachment>, 'children' | 'ref' | 'className'>) => {
  switch (type) {
    case FILE_TYPES.AUDIO: {
      return <FormAttachmentAudio {...props} />;
    }
    case FILE_TYPES.IMAGE: {
      return <FormAttachmentImage {...props} />;
    }
    case FILE_TYPES.VIDEO: {
      return <FormAttachmentVideo {...props} />;
    }
    case FILE_TYPES.UNKNOWN: {
      return <FormAttachmentUnknown {...props} />;
    }
    default: {
      throw checkExhaustive(type);
    }
  }
};
