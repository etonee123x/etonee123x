import { useCallback, useState } from 'react';
import { getRandomExceptCurrentIndex } from '@/shared/utils/get-random-except-current-index';
import type { components } from '@/shared/api/openapi';

type Track = components['schemas']['FolderDataItemAudio'];

/** Owns shuffle mode and selects a random playlist index distinct from the current one. */
export const usePlayerShuffle = ({ playlist }: { playlist: Array<Track> }) => {
  const [isShuffleModeEnabled, setIsShuffleModeEnabled] = useState(false);

  const getShuffleIndex = useCallback(
    (currentIndex: number) => {
      return getRandomExceptCurrentIndex(playlist.length, currentIndex);
    },
    [playlist.length],
  );

  return { getShuffleIndex, isShuffleModeEnabled, setIsShuffleModeEnabled };
};
