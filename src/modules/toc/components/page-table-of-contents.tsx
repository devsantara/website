import { ListIcon } from 'lucide-react';
import * as React from 'react';

import type { TableOfContents as TableOfContentsData } from '#/modules/markdown/markdown.types';
import { normalizeEntries } from '#/modules/toc/toc.utils';
import { buttonVariants } from '#/ui/components/core/button';
import { Popover, PopoverContent, PopoverTrigger } from '#/ui/components/core/popover';
import { cn } from '#/ui/utils';

import { TableOfContents } from './table-of-contents';

/**
 * Responsive shell placed once per article. On wide screens the TOC is fixed in
 * the gutter just right of the centered article; below `xl` — where that gutter
 * collapses — it becomes a floating "On this page" button opening the same list
 * in a popover. Renders nothing when the article has no h2/h3 headings.
 */
export function PageTableOfContents({ toc }: { toc: TableOfContentsData }) {
  const [open, setOpen] = React.useState(false);
  const hasEntries = React.useMemo(() => normalizeEntries(toc).length > 0, [toc]);
  if (!hasEntries) return null;

  return (
    <>
      <aside className="toc-scroll fixed top-24 left-[calc(50%+23rem)] hidden max-h-[calc(100vh-8rem)] w-56 flex-col overflow-y-auto xl:flex">
        <p className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
          <ListIcon className="size-4" aria-hidden />
          On this page
        </p>
        <TableOfContents toc={toc} />
      </aside>

      <div className="xl:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'fixed right-4 bottom-6 z-40 shadow-md',
            )}
          >
            <ListIcon aria-hidden />
            On this page
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="toc-scroll max-h-[60vh] w-64 overflow-y-auto p-3"
          >
            <TableOfContents toc={toc} onNavigate={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
