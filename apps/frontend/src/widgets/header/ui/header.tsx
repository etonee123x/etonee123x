import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/shared/ui/ds/navigation-menu';
import { type HTMLProps } from 'react';
import { cn } from '@/shared/utils/cn';
import { NavigationMenuLink } from './navigation-menu-link';
import { getTranslations } from 'next-intl/server';
import { HeaderSettings } from './header-settings';
import { Link } from '@/i18n/navigation';

export const Header = async ({ className }: Readonly<HTMLProps<HTMLDivElement>>) => {
  const t = await getTranslations('TheHeader');

  const NAVIGATION_MENU_ITEMS = [
    {
      href: '/explorer',
      text: t('content'),
    },
    {
      href: '/blog',
      text: t('blog'),
    },
    {
      href: '/contact-me',
      text: t('contactMe'),
    },
  ];

  return (
    <header
      className={cn(
        'layout-container fixed top-0 z-header grid h-header-height w-full grid-cols-[auto_1fr] grid-rows-[1fr_1fr] py-1 items-center gap-x-2 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-rows-1 sm:gap-2',
        className,
      )}
    >
      <Link
        href="/"
        className={cn(navigationMenuTriggerStyle(), '-ms-2.5 col-start-1 row-start-1 text-xl text-primary')}
      >
        {t('etonee123x')}
      </Link>
      <NavigationMenu className="-ms-2.5 -my-1 col-span-2 row-start-2 min-w-0 max-w-none justify-start sm:m-0 sm:col-start-2 sm:col-span-1 sm:row-start-1">
        <NavigationMenuList className="w-max min-w-max flex-none justify-start">
          {NAVIGATION_MENU_ITEMS.map((navigationMenuItem) => {
            return (
              <NavigationMenuItem key={navigationMenuItem.href}>
                <NavigationMenuLink href={navigationMenuItem.href}>{navigationMenuItem.text}</NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
      <HeaderSettings className="ms-auto col-start-2 row-start-1 sm:col-start-3" />
    </header>
  );
};
