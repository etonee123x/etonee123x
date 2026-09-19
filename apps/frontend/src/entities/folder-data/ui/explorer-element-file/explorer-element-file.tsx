'use client';

import { FILE_TYPES } from '@/entities/file/@x/folder-data';
import { share, ShareButton } from '@/features/share';
import { type components } from '@/shared/api/openapi';
import { CardFooter } from '@/shared/ui/ds/card';
import { checkExhaustive } from '@/shared/utils/check-exhaustive';
import dynamic from 'next/dynamic';
import { type CSSProperties } from 'react';

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

const FileFooter = ({ href, name }: { href: string; name: string }) => {
  const onClickShareButton = () => {
    return share({
      title: name,
      url: new URL(href, globalThis.location.origin).toString(),
    });
  };

  return (
    <footer className="contents">
      <CardFooter className="justify-end">
        <ShareButton className="pointer-events-auto relative z-1" variant="secondary" onClick={onClickShareButton} />
      </CardFooter>
    </footer>
  );
};

export const ExplorerElementFile = ({
  element,
  href,
  style,
}: {
  element: components['schemas']['FolderDataItemFile'];
  href: string;
  style?: CSSProperties;
}) => {
  const footer = <FileFooter href={href} name={element.name} />;

  switch (element.fileType) {
    case FILE_TYPES.AUDIO: {
      return <ExplorerElementFileAudio element={element} href={href} style={style} footer={footer} />;
    }
    case FILE_TYPES.IMAGE: {
      return <ExplorerElementFileImage element={element} href={href} style={style} footer={footer} />;
    }
    case FILE_TYPES.VIDEO: {
      return <ExplorerElementFileVideo element={element} href={href} style={style} footer={footer} />;
    }
    case FILE_TYPES.UNKNOWN: {
      return <ExplorerElementFileUnknown element={element} style={style} footer={footer} />;
    }
    default: {
      throw checkExhaustive(element);
    }
  }
};
