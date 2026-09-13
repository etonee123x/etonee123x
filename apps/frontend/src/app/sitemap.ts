import type { MetadataRoute } from 'next';
import { getPosts } from '@/entities/post';
import { getAllFolderDataPaths } from '@/entities/folder-data';
import { routing } from '@/i18n/routing';
import { getAlternates } from '@/shared/lib/metadata';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

/** Builds a locale-prefixed sitemap entry per configured locale, reusing the same alternates as page metadata. */
const buildEntries = (path: string, lastModified: Date): MetadataRoute.Sitemap => {
  return routing.locales.map((locale) => {
    const { languages } = getAlternates(path, locale);

    return {
      url: `${baseUrl}/${locale}${path}`,
      lastModified,
      alternates: {
        // getAlternates only ever produces plain string hrefs (never URL/descriptor arrays).
        languages: Object.fromEntries(
          Object.entries(languages).map(([alternateLocale, href]) => {
            return [alternateLocale, `${baseUrl}${href}`];
          }),
        ),
      },
    };
  });
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // pageSize omitted -> backend bypasses pagination and returns every post
  const [posts, folderDataPaths] = await Promise.all([getPosts(), getAllFolderDataPaths()]);

  const now = new Date();

  return [
    ...buildEntries('', now),
    ...buildEntries('/blog', now),
    ...buildEntries('/explorer', now),
    ...posts.rows.flatMap((post) => {
      return buildEntries(`/blog/${post._meta.id}`, new Date(post._meta.updatedAt));
    }),
    ...folderDataPaths.flatMap((folderDataPath) => {
      return buildEntries(`/explorer${folderDataPath.path}`, new Date(folderDataPath.updatedAt));
    }),
  ];
}
