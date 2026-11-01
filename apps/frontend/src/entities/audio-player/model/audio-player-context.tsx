'use client';

import { throwError } from '@/shared/utils/throw-error';
import type { components } from '@/shared/api/openapi';
import { createContext, useContext, type RefObject } from 'react';

type Track = components['schemas']['FolderDataItemAudio'];

export const AudioPlayerContext = createContext<{
  audio: RefObject<HTMLAudioElement | null>;
  currentTrack: Track | null;
  playlistPathDirectory: string | null;
  open: (track: Track, playlist: Array<Track>, pathDirectory: string) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (track: Track) => void;
  getQueuePosition: (track: Track) => number | null;
  next: () => void;
  previous: () => void;
  close: () => void;
  isShuffleModeEnabled: boolean;
  setIsShuffleModeEnabled: (isShuffleModeEnabled: boolean) => void;
  setPathDirectory: (pathDirectory: string | null) => void;
  canGoBack: boolean;
} | null>(null);

export const useAudioPlayer = () => {
  return useContext(AudioPlayerContext) ?? throwError();
};
