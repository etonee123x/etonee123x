'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useCssVar, useElementSize } from '@reactuses/core';
import { cn } from '@/shared/utils/cn';
import { isServer } from '@/shared/utils/target';

/**
 * Keeps sticky offsets aligned with the header's content-driven height.
 */
export const HeaderContainer = ({ children, className }: Readonly<{ children: ReactNode; className?: string }>) => {
  const headerRef = useRef<HTMLElement>(null);

  const [, setHeaderHeight] = useCssVar(
    '--header-height',
    isServer ? null : globalThis.document.documentElement,
    '0px',
  );

  const [, height] = useElementSize(headerRef, { box: 'border-box' });

  useEffect(() => {
    setHeaderHeight(`${height}px`);
  }, [height, setHeaderHeight]);

  return (
    <header ref={headerRef} className={cn('layout-container sticky top-0 z-header w-full', className)}>
      {children}
    </header>
  );
};
