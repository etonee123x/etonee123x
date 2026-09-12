import { Card } from '@/shared/ui/ds/card';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { type ComponentProps } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';

export const ExplorerElementFileUnknown = ({
  element,
  href,
}: Pick<ComponentProps<typeof Link>, 'href'> & { element: components['schemas']['FolderDataItemUnknown'] }) => {
  return (
    <article className="contents">
      <Card
        size="sm"
        className="pointer-events-none relative ring-primary bg-transparent transition-colors duration-100 has-[a:hover]:bg-muted has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50"
      >
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <Link
          href={href}
          aria-label={element.name}
          className="pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none"
        />
        <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
      </Card>
    </article>
  );
};
