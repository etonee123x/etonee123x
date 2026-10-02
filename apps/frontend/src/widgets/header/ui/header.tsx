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
import { HeaderContainer } from './header-container';

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
    <HeaderContainer className={cn('flex items-start gap-2 py-1', className)}>
      <div className="-ms-2.5 flex min-w-0 flex-1 flex-wrap items-center gap-y-1">
        <Link href="/" className={cn(navigationMenuTriggerStyle(), ' text-xl text-primary')}>
          {t('etonee123x')}
        </Link>
        <NavigationMenu className="min-w-0 max-w-none flex-1 basis-auto justify-start">
          <NavigationMenuList className="w-full min-w-0 flex-wrap justify-start">
            {NAVIGATION_MENU_ITEMS.map((navigationMenuItem) => {
              return (
                <NavigationMenuItem key={navigationMenuItem.href}>
                  <NavigationMenuLink href={navigationMenuItem.href}>{navigationMenuItem.text}</NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <HeaderSettings className="ms-auto shrink-0" />
    </HeaderContainer>
  );
};
