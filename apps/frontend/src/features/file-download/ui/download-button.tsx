'use client';

import { Button } from '@/shared/ui/ds/button';
import { formatFileSize } from '@/shared/utils/format-file-size';
import { Download } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
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
  const format = useFormatter();
  const t = useTranslations('DownloadButton');
  const { value, unit, maximumFractionDigits } = formatFileSize(fileSize);
  const formattedSize = t('fileSize', { value: format.number(value, { maximumFractionDigits }), unit });

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
