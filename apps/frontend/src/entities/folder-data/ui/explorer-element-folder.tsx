import { Card } from '@/shared/ui/ds/card';
import { Link } from '@/i18n/navigation';
import { type components } from '@/shared/api/openapi';
import { type ComponentProps } from 'react';
import { ExplorerElementHeader } from './explorer-element-header';
import { cn } from '@/shared/utils/cn';

export const ExplorerElementFolder = ({
  element,
  className,
  ...props
}: ComponentProps<typeof Link> & { element: components['schemas']['FolderDataItemFolder'] }) => {
  return (
    <Card className="pointer-events-none relative ring-primary bg-muted/50 transition-colors duration-100 has-[a:hover]:bg-muted has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50">
      {/* Full-card link stays behind content so controls can opt into pointer events. */}
      <Link
        {...props}
        aria-label={element.name}
        className={cn('pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none', className)}
      />
      <ExplorerElementHeader name={element.name} createdAt={element._meta.createdAt} />
    </Card>
  );
};
