'use client';

import { useTheme } from '@teispace/next-themes';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SettingsIcon } from 'lucide-react';
import { useIsAdminContext } from '@/entities/session/client';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/shared/ui/ds/button';
import type { ComponentProps } from 'react';
import { LogoutMenuItem } from '@/features/auth/logout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/ds/dropdown-menu';

const supportedLocales: ReadonlySet<string> = new Set(routing.locales);

const isSupportedLocale = (value: string): value is (typeof routing.locales)[number] => {
  return supportedLocales.has(value);
};

/**
 * Combines locale and theme controls in one accessible settings menu.
 */
export const HeaderSettings = ({ className }: Pick<ComponentProps<typeof Button>, 'className'>) => {
  const { setTheme, theme } = useTheme();
  const { isAdmin } = useIsAdminContext();
  const t = useTranslations('TheHeader');
  const router = useRouter();
  const pathname = usePathname();
  const parameters = useParams();
  const locale = parameters.locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className={className} variant="outline" size="icon" aria-label={t('settings')}>
            <SettingsIcon aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('theme')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value: string) => {
              setTheme(value);
            }}
          >
            {(['light', 'dark', 'system'] as const).map((themeOption) => {
              return (
                <DropdownMenuRadioItem key={themeOption} value={themeOption}>
                  {t(themeOption)}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={typeof locale === 'string' ? locale : ''}
            onValueChange={(value: string) => {
              if (!isSupportedLocale(value)) {
                return;
              }

              router.replace(
                {
                  pathname,
                  // @ts-expect-error -- Current pathname params stay valid when changing locale.
                  params: parameters,
                },
                {
                  locale: value,
                  scroll: false,
                },
              );
            }}
          >
            {routing.locales.map((supportedLocale) => {
              return (
                <DropdownMenuRadioItem key={supportedLocale} value={supportedLocale}>
                  {supportedLocale}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <LogoutMenuItem />
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
