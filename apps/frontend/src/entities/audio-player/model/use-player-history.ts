import { type ContextType, useCallback, useState } from 'react';
import { type AudioPlayerContext } from './audio-player-context';

type Track = NonNullable<NonNullable<ContextType<typeof AudioPlayerContext>>['currentTrack']>;

/** Keeps playback history as a timeline with back/forward navigation and branch truncation. */
export const usePlayerHistory = (initialTrack: Track | null) => {
  const [tracks, setTracks] = useState<Array<Track>>(initialTrack ? [initialTrack] : []);
  const [position, setPosition] = useState<number | null>(initialTrack ? 0 : null);

  const append = useCallback(
    (track: Track) => {
      const nextTracks = tracks.slice(0, (position ?? -1) + 1);

      if (nextTracks.at(-1)?.src !== track.src) {
        nextTracks.push(track);
      }

      setTracks(nextTracks);
      setPosition(nextTracks.length - 1);
    },
    [position, tracks],
  );

  const goBack = useCallback(() => {
    if (position === null || position === 0) {
      return null;
    }

    const previousPosition = position - 1;
    setPosition(previousPosition);

    return tracks[previousPosition] ?? null;
  }, [position, tracks]);

  const goForward = useCallback(() => {
    if (position === null || position >= tracks.length - 1) {
      return null;
    }

    const nextPosition = position + 1;
    setPosition(nextPosition);

    return tracks[nextPosition] ?? null;
  }, [position, tracks]);

  const clear = useCallback(() => {
    setTracks([]);
    setPosition(null);
  }, []);

  return {
    append,
    canGoBack: position !== null && position > 0,
    clear,
    goBack,
    goForward,
  };
};
