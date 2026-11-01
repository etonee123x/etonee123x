'use client';

import { useAudioPlayer } from '@/entities/audio-player';
import { FILE_TYPES } from '@/entities/file';
import { type components } from '@/shared/api/openapi';
import { useEffect, useEffectEvent } from 'react';

export const SendFolderDataToPlayer = ({ folderData }: { folderData: components['schemas']['FolderDataResponse'] }) => {
  const { open, setPathDirectory } = useAudioPlayer();

  // Queue changes update open, but must not reopen the unchanged route track.
  const openFolderTrack = useEffectEvent(() => {
    const fileAudio = folderData.file?.fileType === FILE_TYPES.AUDIO ? folderData.file : null;
    if (!fileAudio) {
      return;
    }

    open(
      fileAudio,
      folderData.files.filter((file) => {
        return file.fileType === FILE_TYPES.AUDIO;
      }),
      folderData.pathDirectory,
    );
  });

  useEffect(() => {
    openFolderTrack();
  }, [folderData]);

  useEffect(() => {
    setPathDirectory(folderData.pathDirectory);

    return () => {
      setPathDirectory(null);
    };
  }, [folderData, setPathDirectory]);

  return null;
};
