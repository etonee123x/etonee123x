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
import { Card, CardContent } from '@/shared/ui/ds/card';
import { cn } from '@/shared/utils/cn';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/shared/ui/ds/item';

export const ExplorerElementFileAudio = ({
  element,
  className,
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
      <Card
        size="sm"
        className="p-(--card-spacing) gap-0 pointer-events-none relative overflow-hidden ring-primary bg-transparent transition-colors duration-100 has-[a:hover]:bg-muted has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50"
      >
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <Link
          {...props}
          scroll={false}
          aria-label={element.name}
          className={cn('pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none', className)}
        />
        <AudioTrackProgress trackSrc={element.src} duration={element.metadata.duration} />

        <div>
          {!isNil(element.metadata.coverSrc) && (
            <img className="w-auto h-full min-h-0 object-cover" src={element.metadata.coverSrc} alt="Cover" />
          )}
          <div>
            <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
            {/* Separator aligns with the card's padded header and content. */}
            <Separator className="mx-(--card-spacing) w-auto!" />
            {/* Cover remains part of card content without importing Item media styles. */}
            <CardContent className="w-full">
              {/* Inline metadata avoids nested cards inside the track card. */}
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
            </CardContent>
          </div>
        </div>
      </Card>
    </article>
  );
};
