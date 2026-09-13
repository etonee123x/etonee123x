import { defineRouting } from 'next-intl/routing';

export const DEFAULT_LOCALE = 'en';

export const routing = defineRouting({
  locales: [DEFAULT_LOCALE, 'ru'],
  defaultLocale: DEFAULT_LOCALE,
});
