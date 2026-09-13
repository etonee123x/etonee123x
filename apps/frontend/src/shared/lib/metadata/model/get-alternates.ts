import { routing } from '@/i18n/routing';

/** Builds canonical + hreflang alternates for a locale-agnostic path (e.g. '', '/blog', '/blog/123'). */
export const getAlternates = (path: string, locale: string) => {
  const languages = Object.fromEntries(
    routing.locales.map((alternateLocale) => {
      return [alternateLocale, `/${alternateLocale}${path}`];
    }),
  );

  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...languages,
      'x-default': `/${routing.defaultLocale}${path}`,
    },
  };
};
