'use client';

import { type ContextType, type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayerContext } from './audio-player-context';
import { usePlayerHistory } from './use-player-history';
import { usePlayerQuery } from './use-player-query';
import { usePlayerShuffle } from './use-player-shuffle';
import { useIsTouchOnly } from '@/shared/hooks/use-is-touch-only';
import { usePathname, useRouter } from '@/i18n/navigation';
import { throwError } from '@/shared/utils/throw-error';
import { useSinglePlayback } from '@/shared/hooks/use-single-playback';
import { localStorageVolume, DEFAULT_VOLUME } from './local-storage-volume';
import { isClient } from '@/shared/utils/target';
import { useEventListener } from '@reactuses/core';
import { isNil } from '@/shared/utils/is-nil';

type Track = NonNullable<NonNullable<ContextType<typeof AudioPlayerContext>>['currentTrack']>;

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

  const [currentTrack, setCurrentTrack] = useState<Track | null>(initialTrack);
  const [playlist, setPlaylist] = useState<Array<Track>>(initialPlaylist);

  const [playlistPathDirectory, setPlaylistPathDirectory] = useState<string | null>(initialPlaylistPathDirectory);

  const {
    append: appendHistoryTrack,
    canGoBack,
    clear: clearHistory,
    goBack,
    goForward,
  } = usePlayerHistory(initialTrack);

  const {
    addToQueue,
    clearQueue,
    clearResumeTrack,
    getQueuePosition,
    handlePlaylistOpen,
    removeFromQueue,
    resumeTrack,
    takeNextTrack,
  } = usePlayerQuery({ currentTrack, playlist });
  const openingPlayerTrack = useRef<Track | null>(null);
  const { getShuffleIndex, isShuffleModeEnabled, setIsShuffleModeEnabled } = usePlayerShuffle({ playlist });

  const isCurrentTrackRoute = Boolean(currentTrack && decodeURIComponent(pathname) === '/explorer' + currentTrack.path);

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
    (openedTrack, playlist, pathDirectory) => {
      if (openingPlayerTrack.current?.src === openedTrack.src) {
        openingPlayerTrack.current = null;
      } else {
        if (currentTrack?.src !== openedTrack.src) {
          appendHistoryTrack(openedTrack);
        }

        setPlaylist(playlist);
        handlePlaylistOpen(openedTrack);
      }

      setCurrentTrack(openedTrack);
      setPlaylistPathDirectory(pathDirectory);
    },
    [appendHistoryTrack, handlePlaylistOpen, currentTrack],
  );

  const close = useCallback(() => {
    clearQueue();
    openingPlayerTrack.current = null;
    setCurrentTrack(null);
    clearHistory();

    if (playlistPathDirectory === pathDirectory.current) {
      router.push('/explorer' + (pathDirectory.current ?? ''), { scroll: false });
    }
  }, [clearHistory, clearQueue, playlistPathDirectory, router]);

  const navigateToTrack = useCallback(
    (nextTrack: Track) => {
      openingPlayerTrack.current = nextTrack;
      router.replace('/explorer' + nextTrack.path, { scroll: false });
    },
    [router],
  );

  /** Keeps the explorer route in sync when playback is currently controlled by that route. */
  const changeTrack = useCallback(
    (nextTrack: Track, wasTakenFromQueue = false) => {
      if (!wasTakenFromQueue) {
        removeFromQueue(nextTrack);
      }

      if (isCurrentTrackRoute) {
        navigateToTrack(nextTrack);
      } else {
        setCurrentTrack(nextTrack);
      }
    },
    [isCurrentTrackRoute, navigateToTrack, removeFromQueue],
  );

  /** Selects a random index in shuffle mode, otherwise advances cyclically from the given track. */
  const getNextTrackIndex = useCallback(
    (resumeTrack?: Track) => {
      if (playlist.length === 0) {
        return null;
      }

      const trackToAdvanceFrom = resumeTrack ?? currentTrack;
      const trackIndex = playlist.findIndex((playlistTrack) => {
        return playlistTrack.src === trackToAdvanceFrom?.src;
      });

      if (isShuffleModeEnabled && playlist.length > 1) {
        return getShuffleIndex(trackIndex);
      }

      if (trackIndex === -1) {
        return resumeTrack === undefined && !isShuffleModeEnabled ? null : 0;
      }

      return (trackIndex + 1) % playlist.length;
    },
    [getShuffleIndex, isShuffleModeEnabled, playlist, currentTrack],
  );

  /** Manual next follows history forward; playback end advances through queue and playlist instead. */
  const advanceToNextTrack = useCallback(
    (shouldGoForwardInHistory: boolean) => {
      const queuedTrack = takeNextTrack();

      if (queuedTrack) {
        appendHistoryTrack(queuedTrack);
        changeTrack(queuedTrack, true);
        return;
      }

      const nextHistoryTrack = shouldGoForwardInHistory ? goForward() : null;

      if (nextHistoryTrack) {
        changeTrack(nextHistoryTrack);
        return;
      }

      if (resumeTrack) {
        clearResumeTrack();

        if (playlist.length === 0) {
          setCurrentTrack(null);
          return;
        }

        const nextPlayingIndex = getNextTrackIndex(resumeTrack);
        const nextTrack = playlist[nextPlayingIndex ?? 0] ?? throwError();
        appendHistoryTrack(nextTrack);
        changeTrack(nextTrack);
        return;
      }

      const nextPlayingIndex = getNextTrackIndex();
      if (nextPlayingIndex === null) {
        return;
      }

      const nextTrack = playlist[nextPlayingIndex] ?? throwError();
      appendHistoryTrack(nextTrack);
      changeTrack(nextTrack);
    },
    [
      appendHistoryTrack,
      changeTrack,
      clearResumeTrack,
      getNextTrackIndex,
      goForward,
      playlist,
      resumeTrack,
      takeNextTrack,
    ],
  );

  const next = useCallback(() => {
    advanceToNextTrack(true);
  }, [advanceToNextTrack]);

  const advanceAfterTrackEnded = useCallback(() => {
    advanceToNextTrack(false);
  }, [advanceToNextTrack]);

  const currentPlayingIndex = (() => {
    const index = playlist.findIndex((playlistTrack) => {
      return playlistTrack.src === currentTrack?.src;
    });

    return index === -1 ? null : index;
  })();

  const previous = useCallback(() => {
    const previousHistoryTrack = goBack();

    if (previousHistoryTrack) {
      changeTrack(previousHistoryTrack);

      return;
    }

    if (currentPlayingIndex === null || playlist.length === 0) {
      return;
    }

    const previousPlayingIndex = (currentPlayingIndex - 1 + playlist.length) % playlist.length;
    const previousTrack = playlist[previousPlayingIndex] ?? throwError();
    changeTrack(previousTrack);
  }, [changeTrack, currentPlayingIndex, goBack, playlist]);

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
      advanceAfterTrackEnded();
    },
    audio,
  );

  useEffect(() => {
    if (!currentTrack) {
      unloadMedia();
      return;
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.metadata.artists.join(', '),
        album: currentTrack.metadata.album ?? undefined,
        artwork: isNil(currentTrack.metadata.cover)
          ? undefined
          : [
              {
                src: currentTrack.metadata.cover.src,
                sizes: [currentTrack.metadata.cover.width, currentTrack.metadata.cover.height].join('x'),
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

    audio.current.src = currentTrack.src;
  }, [currentTrack, unloadMedia]);

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
      currentTrack,
      playlistPathDirectory,
      open,
      addToQueue,
      removeFromQueue,
      getQueuePosition,
      next,
      previous,
      close,
      isShuffleModeEnabled,
      setIsShuffleModeEnabled,
      setPathDirectory,
      canGoBack,
    };
  }, [
    close,
    canGoBack,
    isShuffleModeEnabled,
    next,
    open,
    addToQueue,
    removeFromQueue,
    getQueuePosition,
    previous,
    setIsShuffleModeEnabled,
    setPathDirectory,
    playlistPathDirectory,
    currentTrack,
  ]);

  return <AudioPlayerContext value={playerValue}>{children}</AudioPlayerContext>;
};
