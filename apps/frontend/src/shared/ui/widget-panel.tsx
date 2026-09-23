import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { MoveRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';

/** Renders the shared widget shell while leaving header and body content to each widget. */
export const WidgetPanel = ({
  title,
  description,
  link,
  children,
}: PropsWithChildren<
  Readonly<{
    title: ReactNode;
    description: ReactNode;
    link: Pick<ComponentProps<typeof Link>, 'href' | 'children'>;
  }>
>) => {
  return (
    <section className="flex flex-col gap-6 rounded-4xl border border-primary/40 bg-primary/5 p-4">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-baseline gap-x-2 gap-y-3">
        <hgroup className="contents">
          <h2 className="col-start-1 row-start-1 min-w-0 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="col-span-2 row-start-2 min-w-0 wrap-break-word text-sm text-muted-foreground">{description}</p>
        </hgroup>
        <div className="col-start-2 row-start-1 flex min-w-0 max-w-full justify-self-end text-right text-xs leading-none">
          <Link
            className="flex min-w-0 max-w-full items-center gap-1 text-foreground transition-colors hover:text-foreground/80 relative after:w-full after:h-px after:bg-current after:absolute after:bottom-0"
            {...link}
          >
            {link.children}
            <MoveRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
      {children}
    </section>
  );
};
