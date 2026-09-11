'use client';

import { useEventListener } from '@reactuses/core';
import { useAudioPlayer } from '../model/audio-player-context';
import { useState } from 'react';

const ActiveTrackProgress = ({ duration }: { duration: number }) => {
  const { audio } = useAudioPlayer();

  const getCurrentTime = () => {
    return audio.current?.currentTime ?? 0;
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEventListener(
    'timeupdate',
    () => {
      setCurrentTime(getCurrentTime());
    },
    audio,
  );

  useEventListener(
    'loadstart',
    () => {
      setCurrentTime(getCurrentTime());
    },
    audio,
  );

  const percent = duration > 0 ? Math.min(100, ((currentTime * 1000) / duration) * 100) : 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -z-1 inset-y-0 inset-s-0 bg-primary/20 transition-colors duration-100 group-hover/audio:bg-primary/50"
      style={{ width: `${percent}%` }}
    />
  );
};

export const AudioTrackProgress = ({ trackSrc, duration }: { trackSrc: string; duration: number }) => {
  const { track } = useAudioPlayer();

  return track?.src === trackSrc ? <ActiveTrackProgress duration={duration} /> : null;
};
