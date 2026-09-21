'use client';

import { useTimeoutFn } from '@reactuses/core';
import { Button } from '@/shared/ui/ds/button';
import { Check, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ComponentProps } from 'react';

export const ShareButton = ({
  onClick,
  ...props
}: Readonly<Omit<ComponentProps<typeof Button>, 'aria-label' | 'children' | 'title'>>) => {
  const t = useTranslations('ShareButton');
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [, startCopiedLinkTimeout] = useTimeoutFn(
    () => {
      setHasCopiedLink(false);
    },
    1500,
    { immediate: false },
  );

  const handleClick: ComponentProps<typeof Button>['onClick'] = (event) => {
    const result = onClick?.(event);

    Promise.resolve(result).then(() => {
      setHasCopiedLink(true);
      startCopiedLinkTimeout();
    });
  };

  return (
    <Button
      {...props}
      aria-label={hasCopiedLink ? t('copied') : t('share')}
      title={hasCopiedLink ? t('copied') : t('share')}
      onClick={handleClick}
    >
      {hasCopiedLink ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
    </Button>
  );
};
