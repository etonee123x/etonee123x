'use client';

import { FILE_TYPES } from '@/entities/file/@x/folder-data';
import { type components } from '@/shared/api/openapi';
import { Button } from '@/shared/ui/ds/button';
import { CardFooter } from '@/shared/ui/ds/card';
import { checkExhaustive } from '@/shared/utils/check-exhaustive';
import { Share2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { type CSSProperties, type ReactNode } from 'react';

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

const FileShareFooter = ({ href, name }: { href: string; name: string }) => {
  const t = useTranslations('ExplorerElementFile');

  const onClickShare = async () => {
    try {
      await globalThis.navigator.share({
        title: name,
        url: new URL(href, globalThis.location.origin).toString(),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      throw error;
    }
  };

  return (
    <footer className="contents">
      <CardFooter className="justify-end">
        <Button
          className="pointer-events-auto relative z-1"
          aria-label={t('share')}
          variant="secondary"
          onClick={onClickShare}
        >
          <Share2 />
        </Button>
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
  const footer: ReactNode = <FileShareFooter href={href} name={element.name} />;

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
