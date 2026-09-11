import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/shared/ui/ds/navigation-menu';
import { type HTMLProps } from 'react';
import { cn } from '@/shared/utils/cn';
import { ThemeSwitcher } from '@/features/theme';
import { LocaleSwitcher } from '@/features/locale/switch-locale';
import { ButtonLogout } from '@/features/auth/logout';
import { NavigationMenuLink } from './navigation-menu-link';
import { getIsAdmin } from '@/entities/session/server';
import { getTranslations } from 'next-intl/server';

export const Header = async ({ className }: Readonly<HTMLProps<HTMLDivElement>>) => {
  const t = await getTranslations('TheHeader');
  const isAdmin = await getIsAdmin();

  const NAVIGATION_MENU_ITEMS = [
    {
      className: 'text-xl text-primary',
      href: '/',
      text: t('etonee123x'),
    },
    {
      href: '/explorer',
      text: t('content'),
    },
    {
      href: '/blog',
      text: t('blog'),
    },
  ];

  return (
    <header className={cn('layout-container flex items-center py-2 z-header gap-4', className)}>
      <NavigationMenu className="-ms-2.5">
        <NavigationMenuList>
          {NAVIGATION_MENU_ITEMS.map((navigationMenuItem) => {
            return (
              <NavigationMenuItem key={navigationMenuItem.href}>
                <NavigationMenuLink href={navigationMenuItem.href} className={navigationMenuItem.className}>
                  {navigationMenuItem.text}
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex gap-2 items-center ms-auto">
        <ThemeSwitcher />
        <LocaleSwitcher />
        {isAdmin && <ButtonLogout />}
      </div>
    </header>
  );
};
