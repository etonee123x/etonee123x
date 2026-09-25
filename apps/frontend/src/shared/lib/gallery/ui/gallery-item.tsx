import Image from 'next/image';
import type { GalleryItem as TGalleryItem } from '../types/gallery-item';
import { Video } from './video';
import { cn } from '@/shared/utils/cn';
import type { ComponentProps } from 'react';

export const GalleryItem = ({
  galleryItem,
  className,
  style,
}: {
  galleryItem: TGalleryItem;
} & Pick<ComponentProps<typeof Image> | ComponentProps<typeof Video>, 'className' | 'style'>) => {
  const propsBase = {
    className: cn('h-full w-full object-contain', className),
    style,
    width: galleryItem.width,
    height: galleryItem.height,
    src: galleryItem.src,
  };

  if (galleryItem.type === 'image') {
    return <Image {...propsBase} alt={galleryItem.name} />;
  }

  return <Video {...propsBase} />;
};
