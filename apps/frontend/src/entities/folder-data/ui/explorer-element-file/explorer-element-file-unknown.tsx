'use client';

import { Card } from '@/shared/ui/ds/card';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ExplorerElementHeader } from '../explorer-element-header';
import {
  EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME,
  EXPLORER_ELEMENT_FILE_CARD_LINK_CLASS_NAME,
} from './explorer-element-file-card-classes';

/** Removes locale and trailing slash so route paths can be compared consistently. */
const normalizeExplorerPath = (pathname: string) => {
  return pathname.replace(/^\/[^/]+(?=\/explorer(?:\/|$))/, '').replace(/\/$/, '');
};

/** Detects locale-only navigation, which must not trigger another file download. */
const isLocaleChange = (previousPathname: string | null, pathname: string) => {
  return (
    previousPathname !== null &&
    previousPathname !== pathname &&
    normalizeExplorerPath(previousPathname) === normalizeExplorerPath(pathname)
  );
};

export const ExplorerElementFileUnknown = ({
  element,
  href,
  style,
  footer,
}: {
  element: components['schemas']['FolderDataItemUnknown'];
  href: string;
  style?: CSSProperties;
  footer: ReactNode;
}) => {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const isCurrentFile = normalizeExplorerPath(pathname) === normalizeExplorerPath(href);

  useEffect(() => {
    // Download only when this card represents the current route, excluding locale switches.
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (!isCurrentFile || isLocaleChange(previousPathname, pathname)) {
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = element.src;
    downloadLink.download = element.name;
    downloadLink.click();
  }, [element.name, element.src, isCurrentFile, pathname]);

  return (
    <article className="contents">
      <Card size="sm" style={style} className={EXPLORER_ELEMENT_FILE_CARD_CLASS_NAME}>
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <Link
          href={href}
          scroll={false}
          aria-label={element.name}
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
