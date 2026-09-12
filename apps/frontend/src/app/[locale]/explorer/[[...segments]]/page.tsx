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
  isFolderDataItemFileAudio,
  isFolderDataItemFileImage,
  isFolderDataItemFileVideo,
} from '@/entities/folder-data';
import type { Metadata } from 'next';
import { millisecondsToHumanReadable } from '@/shared/utils/milliseconds-to-human-readable';
import { notFound } from 'next/navigation';
import { getSiteImage } from '@/shared/lib/metadata';
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
  const t = await getTranslations('Explorer');

  const intlListFormat = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });

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

  if (isFolderDataItemFileAudio(folderData.file)) {
    return {
      ...defaults,
      description: t('description.audio.checkOutTrack', {
        name: folderData.file.name,
        artists:
          folderData.file.metadata.artists.length > 0
            ? intlListFormat.format(folderData.file.metadata.artists)
            : t('description.audio.idkWho'),
        album: t('description.audio.album', {
          album: folderData.file.metadata.album ?? folderName,
        }),
        year: folderData.file.metadata.year ? t('description.audio.year', { year: folderData.file.metadata.year }) : '',
        duration: folderData.file.metadata.duration
          ? t('description.audio.duration', {
              duration: millisecondsToHumanReadable(folderData.file.metadata.duration),
            })
          : '',
      }),
    };
  }

  return {
    ...defaults,
    description: t('description.common.soWhatWeHaveHere', {
      folderName,
      fileDescription: folderData.file
        ? t('description.common.watch', {
            type: isFolderDataItemFileImage(folderData.file)
              ? t('description.common.image')
              : t('description.common.video'),
            fileName: folderData.file.name,
          })
        : '',
    }),
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
    <section className="layout-container">
      <SendFolderDataToPlayer folderData={folderData} />
      <SendFolderDataToGallery folderData={folderData} lastNavigationItemHref={lastNavigationItem.href} />
      <h1 className="h1 mb-4">{t('content')}</h1>

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
      <div role="list" className="mb-4 flex w-full flex-col gap-4">
        <nav className="contents">
          {navigationItemUp && <ExplorerElementUp href={navigationItemUp.href} />}
          {folderData.folders.map((folder) => {
            return <ExplorerElementFolder key={folder.name} element={folder} href={folderDataItemToHref(folder)} />;
          })}
        </nav>
        {folderData.files.map((file) => {
          return <ExplorerElementFile key={file.name} element={file} href={folderDataItemToHref(file)} />;
        })}
      </div>
    </section>
  );
}
