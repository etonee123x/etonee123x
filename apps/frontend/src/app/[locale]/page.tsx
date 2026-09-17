import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAlternates } from '@/shared/lib/metadata';
import { BlogWidget } from '@/widgets/posts';
import { ExplorerWidget } from '@/widgets/explorer-widget';

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
  const [explorerWidget, blogWidget] = await Promise.all([ExplorerWidget(), BlogWidget()]);

  return (
    <section className="layout-container mb-4">
      <h1 className="h1 mb-4">{t('indexPage')}</h1>
      {explorerWidget || blogWidget ? (
        <div className="flex flex-col gap-4">
          {explorerWidget}
          {blogWidget}
        </div>
      ) : (
        <p className="text-[1px]">{t('yesThereIsNothingHere')}</p>
      )}
    </section>
  );
}
