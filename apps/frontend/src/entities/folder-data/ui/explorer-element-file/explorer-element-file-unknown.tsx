import { Card } from '@/shared/ui/ds/card';
import { type components } from '@/shared/api/openapi';
import { type CSSProperties } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';

export const ExplorerElementFileUnknown = ({
  element,
  style,
}: {
  element: components['schemas']['FolderDataItemUnknown'];
  style?: CSSProperties;
}) => {
  return (
    <article className="contents">
      <Card
        size="sm"
        style={style}
        className="pointer-events-none relative ring-primary bg-(--explorer-element-bg) transition-colors duration-100 has-[a:hover]:bg-muted has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50"
      >
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <a
          href={element.src}
          aria-label={element.name}
          download={element.name}
          className="pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none"
        />
        <header className="contents">
          <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
        </header>
      </Card>
    </article>
  );
};
