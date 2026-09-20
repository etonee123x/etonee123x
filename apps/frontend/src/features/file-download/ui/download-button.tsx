'use client';

import { Button } from '@/shared/ui/ds/button';
import { formatFileSize } from '@/shared/utils/format-file-size';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

export const DownloadButton = ({
  href,
  download,
  fileSize,
  ...props
}: Readonly<
  Omit<ComponentProps<typeof Button>, 'children' | 'aria-label' | 'render' | 'variant'> &
    Pick<ComponentProps<'a'>, 'href' | 'download'> & {
      fileSize: number;
    }
>) => {
  const t = useTranslations('DownloadButton');
  const formattedSize = formatFileSize(fileSize);

  return (
    <Button
      {...props}
      variant="secondary"
      render={<a href={href} download={String(download)} />}
      title={formattedSize}
      aria-label={t('downloadFile', { size: formattedSize })}
      nativeButton={false}
    >
      <Download aria-hidden="true" />
    </Button>
  );
};
