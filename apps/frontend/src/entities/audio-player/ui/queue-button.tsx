'use client';

import { useAudioPlayer } from '../model/audio-player-context';
import type { components } from '@/shared/api/openapi';
import { Badge } from '@/shared/ui/ds/badge';
import { Button } from '@/shared/ui/ds/button';
import { ListPlus, ListX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/shared/ui/ds/toast';

// Shared visual props keep both queue actions consistent.
const buttonProps = {
  className: 'pointer-events-auto relative z-1',
  size: 'icon',
  variant: 'secondary',
} as const;

/** Toggles the selected track in the player's queue. */
export const QueueButton = ({ track }: { track: components['schemas']['FolderDataItemAudio'] }) => {
  const t = useTranslations('QueueButton');
  const { currentTrack, addToQueue, removeFromQueue, getQueuePosition } = useAudioPlayer();

  if (!currentTrack || currentTrack.src === track.src) {
    return null;
  }

  const queuePosition = getQueuePosition(track);

  if (queuePosition !== null) {
    const queuePositionLabel = t('queuePosition', { position: queuePosition });

    return (
      <Button
        {...buttonProps}
        aria-label={t('removeFromQueue')}
        title={t('removeFromQueue')}
        onClick={() => {
          removeFromQueue(track);
          toast.add({ description: t('trackRemovedFromQueue', { trackName: track.name }), type: 'info' });
        }}
      >
        <ListX />
        <Badge
          className="pointer-events-none absolute inset-e-0 top-0 z-1 h-5 min-w-5 px-1 translate-x-1/3 -translate-y-1/3 text-xs tabular-nums"
          aria-label={queuePositionLabel}
          title={queuePositionLabel}
        >
          {queuePosition}
        </Badge>
      </Button>
    );
  }

  return (
    <Button
      {...buttonProps}
      aria-label={t('addToQueue')}
      title={t('addToQueue')}
      onClick={() => {
        addToQueue(track);
        toast.add({ description: t('trackAddedToQueue', { trackName: track.name }), type: 'success' });
      }}
    >
      <ListPlus />
    </Button>
  );
};
