'use client';

import { usePathname } from '@/i18n/navigation';

/**
 * Reports whether a navigation href matches the current route.
 */
export const useIsMenuLinkActive = (href: string) => {
  const pathname = usePathname();
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
};
