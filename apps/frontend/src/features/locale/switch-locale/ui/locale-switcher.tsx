'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/ds/dropdown-menu';
import { Button } from '@/shared/ui/ds/button';
import { routing } from '@/i18n/routing';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';

export const LocaleSwitcher = ({ className }: Readonly<React.ComponentProps<typeof Button>>) => {
  const router = useRouter();
  const pathname = usePathname();
  const parameters = useParams();

  const onClickLocale = useCallback(
    (...[, locale]: [unknown, (typeof routing.locales)[number]]) => {
      router.replace(
        {
          pathname,
          // @ts-expect-error -- TypeScript will validate that only known `params`
          // are used in combination with a given `pathname`. Since the two will
          // always match for the current route, we can skip runtime checks.
          params: parameters,
        },
        {
          locale,
          scroll: false,
        },
      );
    },
    [parameters, pathname, router],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={className}
        render={
          <Button variant="outline" size="icon">
            {parameters.locale}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {routing.locales.map((locale) => {
          return (
            <DropdownMenuItem
              key={locale}
              onClick={(event) => {
                onClickLocale(event, locale);
              }}
            >
              {locale}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
