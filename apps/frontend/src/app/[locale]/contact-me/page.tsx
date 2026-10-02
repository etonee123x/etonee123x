import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAlternates } from '@/shared/lib/metadata';
import { ContactMeForm } from '@/features/contact-me';

/**
 * Builds localized metadata and canonical links for the contact-me route.
 */
export const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations('ContactMePage');

  return {
    title: t('contactMe'),
    description: t('questionIdeaOrRecommendation'),
    alternates: getAlternates('/contact-me', locale),
  };
};

/**
 * Renders the localized contact-me page without adding it to site navigation.
 */
export default async function ContactMePage() {
  const t = await getTranslations('ContactMePage');

  return (
    <section className="layout-container mb-6">
      <h1 className="h1 mb-6">{t('contactMe')}</h1>
      <ContactMeForm />
    </section>
  );
}
