'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils/cn';
import { navigationMenuTriggerStyle } from '@/shared/ui/ds/navigation-menu';
import { useIsMenuLinkActive } from '../model/use-is-menu-link-active';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Marks the brand as current page on the home route for visual and assistive-technology feedback.
 */
export const BrandLink = ({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & Readonly<{ children: ReactNode }>) => {
  const isActive = useIsMenuLinkActive('/');

  return (
    <Link
      {...props}
      href="/"
      data-active={isActive ? '' : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        navigationMenuTriggerStyle(),
        'text-xl text-primary data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted',
        className,
      )}
    >
      {children}
    </Link>
  );
};
