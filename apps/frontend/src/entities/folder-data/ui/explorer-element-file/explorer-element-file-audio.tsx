import { Separator } from '@/shared/ui/ds/separator';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { millisecondsToHumanReadable } from '@/shared/utils/milliseconds-to-human-readable';
import { Calendar, Clock, Disc3, Metronome, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';
import { AudioTrackProgress } from '@/entities/audio-player/@x/folder-data';
import { isNil } from '@/shared/utils/is-nil';
import { Card, CardContent } from '@/shared/ui/ds/card';
import Image from 'next/image';
import {
  EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME,
  EXPLORER_ELEMENT_FILE_CARD_LINK_CLASS_NAME,
} from './explorer-element-file-card-classes';
import { cn } from '@/shared/utils/cn';

export const ExplorerElementFileAudio = ({
  element,
  href,
  style,
  footer,
}: Pick<ComponentProps<typeof Link>, 'href'> & {
  element: components['schemas']['FolderDataItemAudio'];
  style?: CSSProperties;
  footer: ReactNode;
}) => {
  const t = useTranslations('ExplorerElementAudio');

  const metadataItems = [
    ...(element.metadata.duration
      ? [
          {
            key: 'duration',
            title: t('duration'),
            Icon: Clock,
            value: millisecondsToHumanReadable(element.metadata.duration),
          },
        ]
      : []),
    ...(element.metadata.artists.length > 0
      ? [
          {
            key: 'artists',
            title: t('artists'),
            Icon: Users,
            value: element.metadata.artists.join(' & '),
          },
        ]
      : []),
    ...(element.metadata.album
      ? [
          {
            key: 'album',
            title: t('album'),
            Icon: Disc3,
            value: element.metadata.album,
          },
        ]
      : []),
    ...(element.metadata.year
      ? [
          {
            key: 'year',
            title: t('year'),
            Icon: Calendar,
            value: element.metadata.year,
          },
        ]
      : []),
    ...(element.metadata.bpm
      ? [
          {
            key: 'bpm',
            title: t('bpm'),
            Icon: Metronome,
            value: element.metadata.bpm,
          },
        ]
      : []),
  ];

  return (
    <article className="contents">
      <Card
        size="sm"
        style={style}
        className={cn('group/audio @container/audio overflow-hidden', EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME)}
      >
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <Link
          href={href}
          scroll={false}
          aria-label={element.name}
          className={EXPLORER_ELEMENT_FILE_CARD_LINK_CLASS_NAME}
        />
        <AudioTrackProgress trackSrc={element.src} duration={element.metadata.duration} />

        <div className="grid grid-cols-1 @sm/audio:has-data-cover:grid-cols-[auto_1fr] grid-rows-[repeat(3, auto)]">
          <header className="contents">
            {!isNil(element.metadata.cover) && (
              <Image
                data-cover
                className="w-full aspect-square object-cover relative z-1 -mt-(--card-spacing) @sm:mt-0 @sm:ms-(--card-spacing) shrink-0 self-start mb-(--card-spacing) @sm/audio:mb-0 @sm/audio:size-23 @sm/audio:row-span-3 @sm/audio:rounded-sm"
                src={element.metadata.cover.src}
                alt={t('cover', { trackName: element.name })}
                width={element.metadata.cover.width}
                height={element.metadata.cover.height}
              />
            )}
            <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
          </header>
          {/* Separator aligns with the card's padded header and content. */}
          <Separator className="m-(--card-spacing) w-auto!" />
          <CardContent>
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              {metadataItems.map((metadataItem) => {
                return (
                  <div
                    key={metadataItem.key}
                    className="grid gap-x-2 grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center"
                  >
                    <dt className="contents font-normal">
                      <metadataItem.Icon aria-hidden="true" className="row-span-2 size-6 shrink-0" />
                      <span className="text-muted-foreground">{metadataItem.title}</span>
                    </dt>
                    <dd className="text-secondary-foreground">{metadataItem.value}</dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </div>
        {footer}
      </Card>
    </article>
  );
};
