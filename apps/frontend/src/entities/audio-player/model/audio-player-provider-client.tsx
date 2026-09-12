'use client';

import { type ContextType, type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayerContext } from './audio-player-context';
import { useIsTouchOnly } from '@/shared/hooks/use-is-touch-only';
import { usePathname, useRouter } from '@/i18n/navigation';
import { getRandomExceptCurrentIndex } from '@/shared/utils/get-random-except-current-index';
import { throwError } from '@/shared/utils/throw-error';
import { useSinglePlayback } from '@/shared/hooks/use-single-playback';
import { localStorageVolume, DEFAULT_VOLUME } from './local-storage-volume';
import { isClient } from '@/shared/utils/target';
import { useEventListener } from '@reactuses/core';
import { isNil } from '@/shared/utils/is-nil';

type Track = NonNullable<NonNullable<ContextType<typeof AudioPlayerContext>>['track']>;

export const AudioPlayerProviderClient = ({
  children,
  initialTrack,
  initialPlaylist,
  initialPlaylistPathDirectory,
}: PropsWithChildren<{
  initialTrack: Track | null;
  initialPlaylist: Array<Track>;
  initialPlaylistPathDirectory: string | null;
}>) => {
  const router = useRouter();

  const pathname = usePathname();

  const isTouchOnly = useIsTouchOnly();

  const [track, setTrack] = useState<Track | null>(initialTrack);

  const [playlist, setPlaylist] = useState<Array<Track>>(initialPlaylist);

  const [playlistPathDirectory, setPlaylistPathDirectory] = useState<string | null>(initialPlaylistPathDirectory);

  const [isShuffleModeEnabled, setIsShuffleModeEnabled] = useState(false);

  const [historyItems, setHistoryItems] = useState<Array<number>>([]);

  const pathDirectory = useRef<string | null>(initialPlaylistPathDirectory);

  const audio = useRef<HTMLAudioElement | null>(null);

  // eslint-disable-next-line react-hooks/refs -- create one stable browser Audio resource.
  if (audio.current === null && isClient) {
    const audioCurrent = new Audio();

    audioCurrent.volume = isTouchOnly ? DEFAULT_VOLUME : localStorageVolume.get();
    audioCurrent.autoplay = true;

    audio.current = audioCurrent;
  }

  const { playback } = useSinglePlayback({
    onOtherPlayback: () => {
      audio.current?.pause();
    },
  });

  const unloadMedia = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);

      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.metadata = null;
    }

    audio.current?.pause();
    audio.current?.removeAttribute('src');
    audio.current?.load();
  }, []);

  const open: NonNullable<ContextType<typeof AudioPlayerContext>>['open'] = useCallback(
    (track, playlist, pathDirectory) => {
      setTrack(track);
      setPlaylist(playlist);
      setPlaylistPathDirectory(pathDirectory);
    },
    [],
  );

  const close = useCallback(() => {
    setTrack(null);

    if (playlistPathDirectory === pathDirectory.current) {
      router.push('/explorer' + (pathDirectory.current ?? ''), { scroll: false });
    }
  }, [playlistPathDirectory, router]);

  const currentPlayingNumber = playlist.findIndex((playlistItem) => {
    return playlistItem.src === track?.src;
  });

  const setCurrentPlayingNumber: NonNullable<ContextType<typeof AudioPlayerContext>>['setCurrentPlayingNumber'] =
    useCallback(
      (playingNumber) => {
        setTrack(playlist[playingNumber] ?? throwError());
      },
      [playlist],
    );

  const getNextPlayingNumber = useCallback(() => {
    if (currentPlayingNumber === -1 || playlist.length === 0) {
      return null;
    }

    return isShuffleModeEnabled
      ? getRandomExceptCurrentIndex(playlist.length, currentPlayingNumber)
      : (currentPlayingNumber + 1) % playlist.length;
  }, [currentPlayingNumber, isShuffleModeEnabled, playlist.length]);

  const doesRoutePathEqualToTrackPath = useCallback(() => {
    return track && decodeURIComponent(pathname) === '/explorer' + track.path;
  }, [pathname, track]);

  const navigateToTrack = useCallback(
    (_track: Track) => {
      router.replace('/explorer' + _track.path, { scroll: false });
    },
    [router],
  );

  const next = useCallback(() => {
    const nextPlayingNumber = getNextPlayingNumber();
    if (nextPlayingNumber === null) {
      return;
    }

    const nextTrack = playlist[nextPlayingNumber] ?? throwError();
    setHistoryItems((historyItems) => {
      return [...historyItems, currentPlayingNumber];
    });

    if (doesRoutePathEqualToTrackPath()) {
      navigateToTrack(nextTrack);
    } else {
      setCurrentPlayingNumber(nextPlayingNumber);
    }
  }, [
    currentPlayingNumber,
    doesRoutePathEqualToTrackPath,
    getNextPlayingNumber,
    navigateToTrack,
    playlist,
    setCurrentPlayingNumber,
  ]);

  const previous = useCallback(() => {
    if (currentPlayingNumber === -1 || playlist.length === 0) {
      return;
    }

    if (historyItems.length === 0) {
      const previousPlayingNumber = (currentPlayingNumber - 1 + playlist.length) % playlist.length;
      const previousTrack = playlist[previousPlayingNumber] ?? throwError();

      if (doesRoutePathEqualToTrackPath()) {
        navigateToTrack(previousTrack);
      } else {
        setCurrentPlayingNumber(previousPlayingNumber);
      }

      return;
    }

    const previousPlayingNumber = historyItems.at(-1);
    const previousTrack = playlist[previousPlayingNumber ?? 0] ?? throwError();

    setHistoryItems((historyItems) => {
      return historyItems.slice(0, -1);
    });

    if (doesRoutePathEqualToTrackPath()) {
      navigateToTrack(previousTrack);
    } else {
      setCurrentPlayingNumber(previousPlayingNumber ?? 0);
    }
  }, [
    currentPlayingNumber,
    historyItems,
    doesRoutePathEqualToTrackPath,
    navigateToTrack,
    playlist,
    setCurrentPlayingNumber,
  ]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const previousRef = useRef(previous);
  useEffect(() => {
    previousRef.current = previous;
  }, [previous]);

  const setPathDirectory: NonNullable<ContextType<typeof AudioPlayerContext>>['setPathDirectory'] = useCallback(
    (nextPathDirectory) => {
      pathDirectory.current = nextPathDirectory;
    },
    [],
  );

  useEventListener('play', playback, audio);
  useEventListener(
    'volumechange',
    () => {
      if (!audio.current) {
        return;
      }

      localStorageVolume.set(audio.current.volume);
    },
    audio,
  );

  useEventListener(
    'loadstart',
    () => {
      if (!audio.current) {
        return;
      }

      audio.current.currentTime = 0;
    },
    audio,
  );

  useEventListener(
    'emptied',
    () => {
      if (!audio.current) {
        return;
      }

      audio.current.currentTime = 0;
    },
    audio,
  );

  useEventListener(
    'ended',
    () => {
      next();
    },
    audio,
  );

  useEffect(() => {
    if (!track) {
      unloadMedia();
      return;
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name,
        artist: track.metadata.artists.join(', '),
        album: track.metadata.album ?? undefined,
        artwork: isNil(track.metadata.cover)
          ? undefined
          : [
              {
                src: track.metadata.cover.src,
                sizes: [track.metadata.cover.width, track.metadata.cover.height].join('x'),
              },
            ],
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextRef.current();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousRef.current();
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.current?.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.current?.pause();
      });
      navigator.mediaSession.setActionHandler('seekto', ({ seekTime }) => {
        if (!(audio.current && typeof seekTime === 'number')) {
          return;
        }

        audio.current.currentTime = seekTime;
      });
    }

    if (!audio.current) {
      return;
    }

    audio.current.src = track.src;
  }, [track, unloadMedia]);

  useEffect(() => {
    if (!isTouchOnly) {
      if (audio.current) {
        audio.current.volume = localStorageVolume.get();
      }
      return;
    }

    if (audio.current) {
      audio.current.volume = DEFAULT_VOLUME;
    }
  }, [isTouchOnly]);

  useEffect(() => {
    return () => {
      unloadMedia();
    };
  }, [unloadMedia]);

  const playerValue = useMemo<NonNullable<ContextType<typeof AudioPlayerContext>>>(() => {
    return {
      audio,
      track,
      playlistPathDirectory,
      open,
      next,
      previous,
      close,
      isShuffleModeEnabled,
      setIsShuffleModeEnabled,
      setCurrentPlayingNumber,
      setPathDirectory,
      hasHistoryItems: historyItems.length > 0,
    };
  }, [
    close,
    historyItems.length,
    isShuffleModeEnabled,
    next,
    open,
    previous,
    setCurrentPlayingNumber,
    setPathDirectory,
    playlistPathDirectory,
    track,
  ]);

  return <AudioPlayerContext value={playerValue}>{children}</AudioPlayerContext>;
};
