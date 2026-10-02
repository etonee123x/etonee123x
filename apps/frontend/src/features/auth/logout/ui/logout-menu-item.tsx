'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { client } from '@/shared/api/client';
import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/shared/ui/ds/dropdown-menu';

export const LogoutMenuItem = () => {
  const router = useRouter();
  const t = useTranslations('TheHeader');

  const onClick = async () => {
    await client['/auth'].DELETE();
    router.refresh();
  };

  return (
    <DropdownMenuItem
      onClick={() => {
        onClick();
      }}
    >
      <LogOut aria-hidden="true" />
      {t('logOut')}
    </DropdownMenuItem>
  );
};
