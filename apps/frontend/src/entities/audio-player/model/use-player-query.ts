import { useCallback, useRef, useState } from 'react';
import type { components } from '@/shared/api/openapi';

type Track = components['schemas']['FolderDataItemAudio'];

/** Owns upcoming tracks and the playlist track to resume after the queue. */
export const usePlayerQuery = ({ currentTrack, playlist }: { currentTrack: Track | null; playlist: Array<Track> }) => {
  const [queuedTracks, setQueuedTracks] = useState<Array<Track>>([]);
  const [resumeTrack, setResumeTrack] = useState<Track | null>(null);
  const shouldKeepResumeTrack = useRef(false);

  const addToQueue = useCallback(
    (track: Track) => {
      setQueuedTracks((queuedTracks) => {
        return [
          track,
          ...queuedTracks.filter((queuedTrack) => {
            return queuedTrack.src !== track.src;
          }),
        ];
      });
      setResumeTrack((resumeTrack) => {
        return resumeTrack ?? currentTrack;
      });
    },
    [currentTrack],
  );

  const removeFromQueue = useCallback(
    (trackToRemove: Track) => {
      const nextQueuedTracks = queuedTracks.filter((queuedTrack) => {
        return queuedTrack.src !== trackToRemove.src;
      });

      if (nextQueuedTracks.length === queuedTracks.length) {
        return;
      }

      setQueuedTracks(nextQueuedTracks);
      if (nextQueuedTracks.length === 0 && currentTrack?.src === resumeTrack?.src) {
        setResumeTrack(null);
        shouldKeepResumeTrack.current = false;
      }
    },
    [currentTrack, queuedTracks, resumeTrack],
  );

  const takeNextTrack = useCallback(() => {
    const queuedTrack = queuedTracks[0];

    if (!queuedTrack) {
      return null;
    }

    setQueuedTracks(queuedTracks.slice(1));
    if (
      !shouldKeepResumeTrack.current &&
      playlist.some((playlistTrack) => {
        return playlistTrack.src === queuedTrack.src;
      })
    ) {
      setResumeTrack(queuedTrack);
    }

    return queuedTrack;
  }, [playlist, queuedTracks]);

  /** Removes a manually opened queued track and keeps it as the playlist resume point. */
  const handlePlaylistOpen = useCallback(
    (track: Track) => {
      const nextQueuedTracks = queuedTracks.filter((queuedTrack) => {
        return queuedTrack.src !== track.src;
      });
      const wasQueued = nextQueuedTracks.length !== queuedTracks.length;

      if (wasQueued) {
        setQueuedTracks(nextQueuedTracks);
      }

      shouldKeepResumeTrack.current = wasQueued && nextQueuedTracks.length > 0;
      setResumeTrack(nextQueuedTracks.length > 0 ? track : null);
    },
    [queuedTracks],
  );

  const clearQueue = useCallback(() => {
    setQueuedTracks([]);
    setResumeTrack(null);
    shouldKeepResumeTrack.current = false;
  }, []);

  const clearResumeTrack = useCallback(() => {
    setResumeTrack(null);
    shouldKeepResumeTrack.current = false;
  }, []);

  const getQueuePosition = useCallback(
    (trackToCheck: Track) => {
      const queueIndex = queuedTracks.findIndex((queuedTrack) => {
        return queuedTrack.src === trackToCheck.src;
      });

      return queueIndex === -1 ? null : queueIndex + 1;
    },
    [queuedTracks],
  );

  return {
    addToQueue,
    clearQueue,
    clearResumeTrack,
    getQueuePosition,
    handlePlaylistOpen,
    queuedTracks,
    removeFromQueue,
    resumeTrack,
    takeNextTrack,
  };
};
