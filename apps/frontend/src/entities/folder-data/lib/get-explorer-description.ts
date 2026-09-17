import type { components } from '@/shared/api/openapi';
import { millisecondsToHumanReadable } from '@/shared/utils/milliseconds-to-human-readable';
import { getLocale, getTranslations } from 'next-intl/server';
import { isFolderDataItemFileAudio, isFolderDataItemFileImage } from '../model/guards';

/** Builds an explorer description using the caller's translation namespace. */
export const getExplorerDescription = async ({
  folderName,
  file,
}: Readonly<{
  folderName: string;
  file: components['schemas']['FolderDataItemFile'] | null;
}>) => {
  const t = await getTranslations('GetExplorerDescription');
  const locale = await getLocale();

  if (isFolderDataItemFileAudio(file)) {
    return t('audio.checkOutTrack', {
      name: file.name,
      artists:
        file.metadata.artists.length > 0
          ? new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(file.metadata.artists)
          : t('audio.idkWho'),
      album: t('audio.album', { album: file.metadata.album ?? folderName }),
      year: file.metadata.year ? t('audio.year', { year: file.metadata.year }) : '',
      duration: file.metadata.duration
        ? t('audio.duration', {
            duration: millisecondsToHumanReadable(file.metadata.duration),
          })
        : '',
    });
  }

  return t('common.soWhatWeHaveHere', {
    folderName,
    fileDescription: file
      ? t('common.watch', {
          type: isFolderDataItemFileImage(file) ? t('common.image') : t('common.video'),
          fileName: file.name,
        })
      : '',
  });
};
