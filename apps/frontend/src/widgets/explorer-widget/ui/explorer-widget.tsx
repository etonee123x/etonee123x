import { getFolderData, getExplorerDescription, ExplorerElementFile } from '@/entities/folder-data';
import { getTranslations } from 'next-intl/server';
import { WidgetPanel } from '@/shared/ui/widget-panel';
import type { CSSProperties } from 'react';

/** Shows the newest file and links to its containing directory. */
export const ExplorerWidget = async () => {
  const t = await getTranslations('ExplorerWidget');
  const folderData = await getFolderData({ isNewest: true });
  const folderName = decodeURIComponent(folderData.pathDirectory.split('/').findLast(Boolean) ?? 'root');
  const folderHref = `/explorer${folderData.pathDirectory}`;
  const firstFile = folderData.files.at(0);

  if (!firstFile) {
    return null;
  }

  const newestFile = folderData.files.reduce((latestFile, file) => {
    if (file._meta.updatedAt > latestFile._meta.updatedAt) {
      return file;
    }

    return latestFile;
  }, firstFile);

  const description = await getExplorerDescription({ folderName, file: newestFile });

  return (
    <WidgetPanel title={t('content')} description={description} link={{ href: folderHref, children: folderName }}>
      <ExplorerElementFile
        style={{ '--explorer-element-bg': 'var(--background)' } as CSSProperties}
        element={newestFile}
        href={`/explorer${newestFile.path}`}
      />
    </WidgetPanel>
  );
};
