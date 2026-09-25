'use client';

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/ds/dialog';
import { useGalleryContext } from '@/shared/lib/gallery';
import { type ComponentProps } from 'react';
import { Button } from '@/shared/ui/ds/button';
import { BaseAlwaysScrollable } from '@/shared/ui/base-always-scrollable';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { GalleryItem } from './gallery-item';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/utils/cn';

// Place navigation controls in equal-width hit areas along the viewport bottom.
const GALLERY_CONTROL_CLASS =
  'absolute bottom-[calc(50%-50dvh)] h-(--gallery-control-height) w-[50dvw] rounded-none border-none bg-transparent text-foreground/80 shadow-none transition-colors hover:bg-black/10 focus-visible:bg-black/10';

const GalleryControlPrevious = () => {
  const t = useTranslations('Gallery');

  const { galleryItems, renderers, setGalleryItem, galleryItem } = useGalleryContext();

  const currentIndex = galleryItem
    ? galleryItems.findIndex((_galleryItem) => {
        return _galleryItem.src === galleryItem.src;
      })
    : 0;

  const previousGalleryItem = galleryItems[currentIndex - 1];

  const previousControlRender = renderers?.previousControl;

  return (
    previousGalleryItem && (
      <Button
        size="lg"
        variant="ghost"
        className={cn(GALLERY_CONTROL_CLASS, 'inset-s-[calc(50%-50dvw)]')}
        render={previousControlRender}
        nativeButton={!previousControlRender}
        aria-label={t('previousSlide')}
        onClick={() => {
          if (previousControlRender) {
            return;
          }

          setGalleryItem(previousGalleryItem);
        }}
      >
        <ChevronLeftIcon className="size-8" />
      </Button>
    )
  );
};

const GalleryControlNext = () => {
  const t = useTranslations('Gallery');

  const { galleryItems, renderers, setGalleryItem, galleryItem } = useGalleryContext();

  const currentIndex = galleryItem
    ? galleryItems.findIndex((_galleryItem) => {
        return _galleryItem.src === galleryItem.src;
      })
    : 0;

  const nextGalleryItem = galleryItems[currentIndex + 1];

  const nextControlRender = renderers?.nextControl;

  return (
    nextGalleryItem && (
      <Button
        size="lg"
        variant="ghost"
        autoFocus
        className={cn(GALLERY_CONTROL_CLASS, 'inset-e-[calc(50%-50dvw)]')}
        render={nextControlRender}
        nativeButton={!nextControlRender}
        aria-label={t('nextSlide')}
        onClick={() => {
          if (nextControlRender) {
            return;
          }

          setGalleryItem(nextGalleryItem);
        }}
      >
        <ChevronRightIcon className="size-8" />
      </Button>
    )
  );
};

export const Gallery = () => {
  const t = useTranslations('Gallery');

  const { galleryItem, setGalleryItem, onClose, shouldShowName } = useGalleryContext();

  const onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'] = (isOpen) => {
    if (isOpen) {
      return;
    }

    setGalleryItem(null);
    onClose.current?.();
  };

  return (
    <Dialog open={Boolean(galleryItem)} onOpenChange={onOpenChange}>
      {galleryItem && (
        <DialogContent
          style={{
            ['--aspect-ratio' as string]: galleryItem.width / galleryItem.height,
            ['--gallery-control-height' as string]: '4rem',
            ['--gallery-content-padding' as string]: '0.5rem',
            ['--gallery-viewport-gap' as string]: '1rem',
            ['--gallery-name-height' as string]: shouldShowName ? '3rem' : '0rem',
            width: `min(calc(100dvw - 2 * var(--gallery-viewport-gap)), calc((100dvh - var(--gallery-name-height) - 2 * (var(--gallery-viewport-gap) + var(--gallery-control-height))) * var(--aspect-ratio) + 2 * var(--gallery-content-padding)))`,
          }}
          showCloseButton={!shouldShowName}
          className="p-(--gallery-content-padding) border-primary border duration-0 sm:max-w-[unset]"
        >
          <GalleryControlPrevious />
          {shouldShowName && (
            <DialogHeader className="min-w-0 flex flex-row items-center">
              <DialogTitle className="min-w-0 leading-normal">
                <BaseAlwaysScrollable>{galleryItem.name}</BaseAlwaysScrollable>
              </DialogTitle>

              <DialogClose asChild>
                <Button className="ms-auto" variant="ghost" size="icon-sm" aria-label={t('close')}>
                  <XIcon />
                </Button>
              </DialogClose>
            </DialogHeader>
          )}
          <GalleryItem galleryItem={galleryItem} className="aspect-(--aspect-ratio) rounded-md" />
          <GalleryControlNext />
        </DialogContent>
      )}
    </Dialog>
  );
};
