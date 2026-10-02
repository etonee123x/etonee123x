'use client';

import { NavigationMenuLink as _NavigationMenuLink, navigationMenuTriggerStyle } from '@/shared/ui/ds/navigation-menu';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils/cn';
import { type ComponentProps } from 'react';
import { useIsMenuLinkActive } from '../model/use-is-menu-link-active';

export const NavigationMenuLink = ({
  href,
  children,
  className,
  ...props
}: ComponentProps<typeof _NavigationMenuLink> & Required<Pick<ComponentProps<typeof _NavigationMenuLink>, 'href'>>) => {
  const isActive = useIsMenuLinkActive(href);

  return (
    <_NavigationMenuLink
      {...props}
      active={isActive}
      render={<Link href={href} />}
      className={cn(navigationMenuTriggerStyle(), className)}
    >
      {children}
    </_NavigationMenuLink>
  );
};
