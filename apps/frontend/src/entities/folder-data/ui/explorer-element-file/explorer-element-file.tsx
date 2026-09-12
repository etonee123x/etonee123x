import { type Link } from '@/i18n/navigation';
import { FILE_TYPES } from '@/entities/file/@x/folder-data';
import { type components } from '@/shared/api/openapi';
import { checkExhaustive } from '@/shared/utils/check-exhaustive';
import dynamic from 'next/dynamic';
import { type ComponentProps } from 'react';

const ExplorerElementFileAudio = dynamic(() => {
  return import('./explorer-element-file-audio').then((module) => {
    return module.ExplorerElementFileAudio;
  });
});

const ExplorerElementFileImage = dynamic(() => {
  return import('./explorer-element-file-image').then((module) => {
    return module.ExplorerElementFileImage;
  });
});

const ExplorerElementFileVideo = dynamic(() => {
  return import('./explorer-element-file-video').then((module) => {
    return module.ExplorerElementFileVideo;
  });
});

const ExplorerElementFileUnknown = dynamic(() => {
  return import('./explorer-element-file-unknown').then((module) => {
    return module.ExplorerElementFileUnknown;
  });
});

export const ExplorerElementFile = ({
  element,
  href,
}: Pick<ComponentProps<typeof Link>, 'href'> & { element: components['schemas']['FolderDataItemFile'] }) => {
  switch (element.fileType) {
    case FILE_TYPES.AUDIO: {
      return <ExplorerElementFileAudio element={element} href={href} />;
    }
    case FILE_TYPES.IMAGE: {
      return <ExplorerElementFileImage element={element} href={href} />;
    }
    case FILE_TYPES.VIDEO: {
      return <ExplorerElementFileVideo element={element} href={href} />;
    }
    case FILE_TYPES.UNKNOWN: {
      return <ExplorerElementFileUnknown element={element} href={href} />;
    }
    default: {
      throw checkExhaustive(element);
    }
  }
};
