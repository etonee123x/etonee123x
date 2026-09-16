import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAlternates } from '@/shared/lib/metadata';
import { BlogWidget } from '@/widgets/posts';

export const generateMetadata = async ({ params }: Readonly<PageProps<'/[locale]'>>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations('Index');

  return {
    title: `${t('indexPage')} | etonee123x`,
    alternates: getAlternates('', locale),
  };
};

export default async function Home() {
  const t = await getTranslations('Index');

  return (
    <section className="layout-container mb-4">
      <h1 className="h1 mb-4">{t('indexPage')}</h1>
      <div className="flex flex-col gap-2">
        <BlogWidget />
      </div>
    </section>
  );
}
