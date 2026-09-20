import { Card } from '@/shared/ui/ds/card';
import { type components } from '@/shared/api/openapi';
import { type CSSProperties, type ReactNode } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';
import {
  EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME,
  EXPLORER_ELEMENT_FILE_CARD_LINK_CLASS_NAME,
} from './explorer-element-file-card-classes';

export const ExplorerElementFileUnknown = ({
  element,
  style,
  footer,
}: {
  element: components['schemas']['FolderDataItemUnknown'];
  style?: CSSProperties;
  footer: ReactNode;
}) => {
  return (
    <article className="contents">
      <Card size="sm" style={style} className={EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME}>
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <a
          href={element.src}
          aria-label={element.name}
          download={element.name}
          className={EXPLORER_ELEMENT_FILE_CARD_LINK_CLASS_NAME}
        />
        <header className="contents">
          <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
        </header>
        {footer}
      </Card>
    </article>
  );
};
