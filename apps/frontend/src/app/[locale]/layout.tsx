import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';
import { IsAdminProvider } from '@/entities/session';

import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { Toaster } from '@/shared/ui/ds/toast';

import { AudioPlayerProvider, Player } from '@/widgets/player';

import { Gallery } from '@/shared/lib/gallery';
import { GalleryProvider } from '@/widgets/gallery';

import { ThemeProvider } from '@/features/theme';
import { QueryClientProvider } from '@/shared/api/query';

import { getSiteImage } from '@/shared/lib/metadata';

import '@/app/globals.css';
import { getRandomColorTheme } from '@/shared/lib/color-theme';

export const generateMetadata = async ({ params }: Readonly<PageProps<'/[locale]'>>): Promise<Metadata> => {
  const { locale } = await params;
  const images = [await getSiteImage()];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      template: '%s | etonee123x',
      default: 'etonee123x',
    },
    openGraph: {
      url: `/${locale}`,
      type: 'website',
      siteName: 'etonee123x',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      images,
    },
  };
};

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextIntlClientProvider>
      <IsAdminProvider>
        <QueryClientProvider>
          <ThemeProvider>
            <AudioPlayerProvider>
              <GalleryProvider>{children}</GalleryProvider>
            </AudioPlayerProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </IsAdminProvider>
    </NextIntlClientProvider>
  );
};

export default async function RootLayout({ children, params }: Readonly<LayoutProps<'/[locale]'>>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const colorTheme = getRandomColorTheme();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Theme variables render server-side before page content. */}
        <style>{`
          :root {
            ${colorTheme.light}
          }

          :root.dark {
            ${colorTheme.dark}
          }
        `}</style>
      </head>
      <body className="flex flex-col min-h-dvh">
        <Providers>
          <Header className="fixed top-0 w-full z-1 h-header-height" />
          <main className="pt-header-height relative flex flex-col flex-1">{children}</main>
          <Player />
          <Toaster />
          <Footer />
          <Gallery />
        </Providers>
      </body>
    </html>
  );
}
