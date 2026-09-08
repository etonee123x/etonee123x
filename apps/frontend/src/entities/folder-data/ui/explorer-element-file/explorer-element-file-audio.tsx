import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/shared/ui/ds/item';
import { Separator } from '@/shared/ui/ds/separator';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { millisecondsToHumanReadable } from '@/shared/utils/milliseconds-to-human-readable';
import { Calendar, Clock, Disc3, Metronome, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';
import { AudioTrackProgress } from '@/entities/audio-player/@x/folder-data';
import { isNil } from '@/shared/utils/is-nil';
import Image from 'next/image';

export const ExplorerElementFileAudio = ({
  element,
  ...props
}: ComponentProps<typeof Link> & { element: components['schemas']['FolderDataItemAudio'] }) => {
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
      <Item className="border-primary relative overflow-hidden" render={<Link {...props} scroll={false} />}>
        <AudioTrackProgress trackSrc={element.src} duration={element.metadata.duration} />
        <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
        <Separator />
        {!isNil(element.metadata.coverSrc) && (
          <ItemMedia variant="image">
            <Image src={element.metadata.coverSrc} width={40} height={40} alt="Cover" />
          </ItemMedia>
        )}
        <ItemContent className="w-full">
          <ItemGroup className="flex-row overflow-x-auto">
            {metadataItems.map((metadataItem) => {
              return (
                <Item size="xs" className="flex-nowrap" key={metadataItem.key}>
                  <ItemMedia className="self-center! pb-0.5">
                    <metadataItem.Icon className="size-6" />
                  </ItemMedia>
                  <ItemContent className="text-nowrap">
                    <ItemTitle className="text-muted-foreground font-normal">{metadataItem.title}</ItemTitle>
                    <ItemDescription className="text-secondary-foreground text-sm!">
                      {metadataItem.value}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        </ItemContent>
      </Item>
    </article>
  );
};
