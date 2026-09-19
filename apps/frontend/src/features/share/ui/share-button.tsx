'use client';

import { Button } from '@/shared/ui/ds/button';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

export const ShareButton = ({
  ...props
}: Readonly<Omit<ComponentProps<typeof Button>, 'aria-label' | 'children' | 'title'>>) => {
  const t = useTranslations('ShareButton');

  return (
    <Button {...props} aria-label={t('share')} title={t('share')}>
      <Share2 aria-hidden="true" />
    </Button>
  );
};
