import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/ds/breadcrumb';
import { Fragment } from 'react/jsx-runtime';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { QueryClient } from '@tanstack/react-query';
import { type components } from '@/shared/api/openapi';
import { throwError } from '@/shared/utils/throw-error';
import { SendFolderDataToPlayer } from '@/widgets/player';
import { SendFolderDataToGallery } from '@/widgets/gallery';
import {
  getFolderDataQueryOptions,
  getExplorerDescription,
  isFolderDataItemFileAudio,
  isFolderDataItemFileImage,
  isFolderDataItemFileVideo,
} from '@/entities/folder-data';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteImage, getAlternates } from '@/shared/lib/metadata';
import { Link } from '@/i18n/navigation';

const ExplorerElementUp = dynamic(() => {
  return import('@/entities/folder-data').then((module) => {
    return module.ExplorerElementUp;
  });
});

const ExplorerElementFolder = dynamic(() => {
  return import('@/entities/folder-data').then((module) => {
    return module.ExplorerElementFolder;
  });
});

const ExplorerElementFile = dynamic(() => {
  return import('@/entities/folder-data').then((module) => {
    return module.ExplorerElementFile;
  });
});

const folderDataItemToHref = (
  folderDataItem: components['schemas']['FolderDataItemFolder'] | components['schemas']['FolderDataItemFile'],
) => {
  return ['/explorer', folderDataItem.path].join('');
};

export const generateMetadata = async ({
  params,
}: Readonly<PageProps<'/[locale]/explorer/[[...segments]]'>>): Promise<Metadata> => {
  const { segments = [], locale } = await params;
  const queryClient = new QueryClient();
  const folderData = await queryClient.query(getFolderDataQueryOptions('/' + segments.join('/')));

  const navigationItems = pathDirectoryToNavigationItems(folderData.pathDirectory);
  const folderName = (navigationItems.at(-1) ?? throwError()).text;

  const image = isFolderDataItemFileImage(folderData.file)
    ? folderData.file
    : folderData.files.find((file) => {
        return isFolderDataItemFileImage(file);
      });

  const images = image
    ? [
        {
          url: image.src,
          alt: image.name,
          width: image.metadata.width,
          height: image.metadata.height,
        },
      ]
    : [await getSiteImage()];

  const video = isFolderDataItemFileVideo(folderData.file)
    ? folderData.file
    : folderData.files.find((file) => {
        return isFolderDataItemFileVideo(file);
      });

  const audio = isFolderDataItemFileAudio(folderData.file)
    ? folderData.file
    : folderData.files.find((file) => {
        return isFolderDataItemFileAudio(file);
      });

  const defaults: Metadata = {
    title: folderData.file?.name ?? folderName,
    alternates: getAlternates(segments.length > 0 ? `/explorer/${segments.join('/')}` : '/explorer', locale),
    openGraph: {
      url: [`/${locale}/explorer`, segments.join('/')].join('/'),
      images,
      videos: video && {
        url: video.src,
        width: video.metadata.width,
        height: video.metadata.height,
      },
      audio: audio && {
        url: audio.src,
      },
    },
    twitter: {
      images,
    },
  };

  return {
    ...defaults,
    description: await getExplorerDescription({ folderName, file: folderData.file }),
  };
};

const pathDirectoryToNavigationItems = (
  pathDirectory: components['schemas']['FolderDataResponse']['pathDirectory'],
) => {
  return pathDirectory
    .split('/')
    .filter(Boolean)
    .reduce(
      (segments, segment) => {
        return [
          ...segments,
          {
            text: decodeURIComponent(segment),
            href: [segments.at(-1)?.href, segment].join('/'),
          },
        ];
      },
      [
        {
          text: 'root',
          href: '/explorer',
        },
      ],
    );
};

export default async function Explorer({ params }: Readonly<PageProps<'/[locale]/explorer/[[...segments]]'>>) {
  const { segments = [] } = await params;
  const t = await getTranslations('Explorer');

  const queryClient = new QueryClient();
  const folderData = await queryClient.query(getFolderDataQueryOptions('/' + segments.join('/'))).catch(() => {
    return null;
  });
  if (!folderData) {
    return notFound();
  }

  const navigationItems = pathDirectoryToNavigationItems(folderData.pathDirectory);

  const lastNavigationItem = navigationItems.at(-1) ?? throwError();
  const breadcrumbLinks = navigationItems.slice(0, -1);

  const navigationItemUp = navigationItems.at(-2);

  return (
    <section className="layout-container mb-6">
      <SendFolderDataToPlayer folderData={folderData} />
      <SendFolderDataToGallery folderData={folderData} lastNavigationItemHref={lastNavigationItem.href} />
      <h1 className="h1 mb-1">{t('content')}</h1>

      <Breadcrumb className="mb-4 z-explorer-navbar sticky top-header-height">
        <BreadcrumbList>
          {breadcrumbLinks.map((link, index) => {
            return (
              <Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href={link.href} />}>{link.text}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            );
          })}
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary">{lastNavigationItem.text}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Explorer entries use cards; list container provides shared spacing only. */}
      <ul className="flex w-full flex-col gap-4">
        {navigationItemUp && (
          <li className="contents">
            <ExplorerElementUp href={navigationItemUp.href} />
          </li>
        )}
        {folderData.folders.map((folder) => {
          return (
            <li className="contents" key={folder.name}>
              <ExplorerElementFolder element={folder} href={folderDataItemToHref(folder)} />
            </li>
          );
        })}
        {folderData.files.map((file) => {
          return (
            <li className="contents" key={file.name}>
              <ExplorerElementFile element={file} href={folderDataItemToHref(file)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
