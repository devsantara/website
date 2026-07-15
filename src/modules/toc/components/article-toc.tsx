import { ListIcon } from 'lucide-react';
import * as React from 'react';

import type { TableOfContents } from '#/modules/markdown/markdown.types';
import { TocLink, TocList, TocRail, TocRoot, useToc } from '#/modules/toc/components/toc';
import { parseTocEntries } from '#/modules/toc/toc.entries';
import { Button } from '#/ui/components/core/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '#/ui/components/core/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/ui/components/core/sheet';
import { cn } from '#/ui/utils';

/**
 * The article's "On this page" navigation, placed once per article and adapting
 * to three widths:
 *
 * - **Desktop** (`xl` and up): fixed in the gutter just right of the centered
 *   article, always visible ({@link GutterToc}).
 * - **Tablet** (`md`–`xl`, where that gutter collapses): a floating button
 *   opening the list in a right-side sheet ({@link SheetToc}).
 * - **Mobile** (below `md`): a full-width bar pinned to the very bottom like a
 *   bottom navigation bar, opening the list in a drawer ({@link DrawerToc}).
 *
 * All three tiers share one {@link TocRoot}, so the reading position is
 * tracked once no matter which tier is visible. Renders nothing when the
 * article has no h2/h3 headings.
 */
export function ArticleToc({ headings }: { headings: TableOfContents }) {
  const entries = React.useMemo(() => parseTocEntries(headings), [headings]);
  if (entries.length === 0) return null;

  return (
    <TocRoot entries={entries}>
      <GutterToc />
      <div className="hidden md:block xl:hidden">
        <SheetToc />
      </div>
      <div className="md:hidden">
        <DrawerToc />
      </div>
    </TocRoot>
  );
}

const TOC_TITLE = 'On this page';

/** The icon-and-text title shared by every tier's heading. */
function TocTitle() {
  return (
    <>
      <ListIcon className="text-muted-foreground size-4" aria-hidden />
      {TOC_TITLE}
    </>
  );
}

/**
 * The scrollable list every tier shows: rail, links, and the fading
 * `.toc-scroll` viewport (see app.css) that hides its scrollbar and fades the
 * edges while there's more to scroll.
 */
function TocPanel({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { entries } = useToc();

  return (
    <div className={cn('toc-scroll min-h-0 overflow-y-auto', className)}>
      <TocList onNavigate={onNavigate}>
        <TocRail />
        {entries.map((entry) => (
          <TocLink key={entry.id} entry={entry} />
        ))}
      </TocList>
    </div>
  );
}

/** Desktop tier: always visible in the gutter right of the centered article. */
function GutterToc() {
  return (
    <aside className="fixed top-8 left-[calc(50%+23rem)] hidden max-h-[calc(100vh-4rem)] w-56 flex-col xl:flex">
      <p className="text-muted-foreground mb-3 flex shrink-0 items-center gap-2 text-sm">
        <TocTitle />
      </p>
      <TocPanel />
    </aside>
  );
}

/**
 * Tablet tier: a floating outline button in the bottom-right corner opening
 * the TOC in a sheet that slides in from the right, echoing the desktop
 * gutter's position. Closes as soon as a link scrolls the page.
 */
function SheetToc() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="fixed right-4 bottom-6 z-40 shadow-md"
        render={
          <Button variant="secondary">
            <ListIcon aria-hidden /> {TOC_TITLE}
          </Button>
        }
      />
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TocTitle />
          </SheetTitle>
        </SheetHeader>
        <TocPanel className="flex-1 px-4 pb-4" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Mobile tier: a full-width bar fixed to the very bottom — styled like a
 * mobile bottom navigation bar, with a safe-area inset so it clears the home
 * indicator — opening the TOC in a bottom drawer the reader can swipe down to
 * dismiss. Closes as soon as a link scrolls the page.
 */
function DrawerToc() {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
      <DrawerTrigger className="bg-background/90 text-foreground supports-backdrop-filter:bg-background/75 fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] text-sm font-medium shadow-[0_-1px_3px_rgb(0_0_0/0.04)] backdrop-blur">
        <ListIcon className="text-muted-foreground size-4" aria-hidden />
        {TOC_TITLE}
      </DrawerTrigger>
      <DrawerContent className="[--drawer-content-max-height:70dvh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-center gap-2 text-base">
            <TocTitle />
          </DrawerTitle>
        </DrawerHeader>
        <TocPanel className="mt-4 flex-1 px-4 pb-4" onNavigate={() => setOpen(false)} />
        <DrawerFooter className="border-t pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DrawerClose render={<Button variant="secondary" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
