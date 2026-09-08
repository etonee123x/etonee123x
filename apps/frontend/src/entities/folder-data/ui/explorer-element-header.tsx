import { CardHeader } from '@/shared/ui/ds/card';
import { useFormatter, useNow } from 'next-intl';
import type { components } from '@/shared/api/openapi';
import { BaseAlwaysScrollable } from '@/shared/ui/base-always-scrollable';

type Element = components['schemas']['FolderDataItemFile'] | components['schemas']['FolderDataItemFolder'];

const ExplorerElementTime = ({ createdAt }: { createdAt: Element['_meta']['createdAt'] }) => {
  const { relativeTime } = useFormatter();
  const now = useNow();

  return (
    <time
      className="text-muted-foreground shrink-0"
      suppressHydrationWarning
      dateTime={new Date(createdAt).toISOString()}
      title={new Date(createdAt).toISOString()}
    >
      {relativeTime(createdAt, now)}
    </time>
  );
};

export const ExplorerElementHeader = ({
  name,
  createdAt,
}: {
  name: Element['name'];
  createdAt: Element['_meta']['createdAt'];
}) => {
  // Shared card header keeps file and folder titles aligned.
  return (
    <CardHeader className="flex min-w-0 items-center justify-between gap-2">
      <BaseAlwaysScrollable>
        <header className="text-lg">{name}</header>
      </BaseAlwaysScrollable>
      <ExplorerElementTime createdAt={createdAt} />
    </CardHeader>
  );
};
