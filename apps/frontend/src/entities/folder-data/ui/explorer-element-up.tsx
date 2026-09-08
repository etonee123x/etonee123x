import { Card, CardHeader } from '@/shared/ui/ds/card';
import { Link } from '@/i18n/navigation';
import { type ComponentProps } from 'react';
import { cn } from '@/shared/utils/cn';

export const ExplorerElementUp = ({ className, ...props }: ComponentProps<typeof Link>) => {
  return (
    <Card className="pointer-events-none relative ring-primary bg-muted/50 transition-colors duration-100 has-[a:hover]:bg-muted has-[a:focus-visible]:ring-ring has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-ring/50">
      {/* Full-card link stays behind content so controls can opt into pointer events. */}
      <Link
        {...props}
        aria-label="..."
        className={cn('pointer-events-auto absolute inset-0 z-0 rounded-xl outline-none', className)}
      />
      <CardHeader className="text-lg">...</CardHeader>
    </Card>
  );
};
