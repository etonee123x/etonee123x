import { Card, CardContent } from '@/shared/ui/ds/card';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { Separator } from '@/shared/ui/ds/separator';
import { ExplorerElementHeader } from '../explorer-element-header';

export const ExplorerElementFileImage = ({
  element,
  href,
  style,
  footer,
}: Pick<ComponentProps<typeof Link>, 'href'> & {
  element: components['schemas']['FolderDataItemImage'];
  style?: CSSProperties;
  footer: ReactNode;
}) => {
  return (
    <article className="contents">
      <Card
        size="sm"
        style={style}
        className="pointer-events-none relative ring-primary bg-(--explorer-element-bg) transition-colors duration-100 has-[button:hover,a:hover]:bg-muted/50 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50"
      >
        {/* Full-card link stays behind content so controls can opt into pointer events. */}
        <Link
          href={href}
          scroll={false}
          aria-label={element.name}
          className="pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none"
        />
        <header className="contents">
          <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
        </header>
        {/* Separator aligns with the card's padded header and content. */}
        <Separator className="mx-(--card-spacing) w-auto!" />
        <CardContent className="mx-auto max-w-full">
          <Image src={element.src} alt={element.name} width={element.metadata.width} height={element.metadata.height} />
        </CardContent>
        {footer}
      </Card>
    </article>
  );
};
