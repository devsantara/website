'use client';

import { ListIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { TableOfContents as TableOfContentsData } from '#/modules/markdown/markdown.types';
import { useActiveHeadings } from '#/modules/toc/toc.hooks';
import {
  buildThreadPath,
  itemPaddingLeft,
  normalizeEntries,
  threadX,
} from '#/modules/toc/toc.utils';
import { buttonVariants } from '#/ui/components/core/button';
import { Popover, PopoverContent, PopoverTrigger } from '#/ui/components/core/popover';
import { cn } from '#/ui/utils';

import { TocThumb, type ThumbRange } from './toc-thumb';

/** Measured layout of the rendered list, in px, driving the SVG rail. */
interface Geometry {
  width: number;
  height: number;
  path: string;
  bounds: { top: number; height: number }[];
}

interface TableOfContentsProps {
  toc: TableOfContentsData;
  className?: string;
  /** Called after a link scrolls the page — lets the mobile popover close. */
  onNavigate?: () => void;
}

/**
 * The "On this page" navigation: a list of h2/h3 links with a curved SVG rail
 * whose accented thumb follows the headings currently in view (see
 * {@link useActiveHeadings}). Rendered on its own in the desktop gutter and
 * inside the mobile popover by {@link PageTableOfContents}.
 *
 * The rail needs the list's real pixel layout, which only exists after mount, so
 * geometry is measured in an effect and re-measured on reflow — until then just
 * the links render, keeping server and first client render identical.
 */
export function TableOfContents({ toc, className, onNavigate }: TableOfContentsProps) {
  const entries = useMemo(() => normalizeEntries(toc), [toc]);
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const active = useActiveHeadings(ids);

  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || entries.length === 0) return;

    const measure = () => {
      const bounds = entries.map((_, index) => {
        const element = itemRefs.current[index];
        return element
          ? { top: element.offsetTop, height: element.offsetHeight }
          : { top: 0, height: 0 };
      });
      const centers = entries.map((entry, index) => ({
        x: threadX(entry.level),
        y: bounds[index].top + bounds[index].height / 2,
      }));
      // Extend the rail from the first/last centers out to the top and bottom
      // edges of those items, so it spans their full height rather than stopping
      // at their midpoints. Same x as their item, so these are straight runs.
      const first = bounds[0];
      const last = bounds[bounds.length - 1];
      const points = [
        { x: centers[0].x, y: first.top },
        ...centers,
        { x: centers[centers.length - 1].x, y: last.top + last.height },
      ];
      setGeometry({
        width: list.offsetWidth,
        height: list.offsetHeight,
        path: buildThreadPath(points),
        bounds,
      });
    };

    measure();
    // Re-measure when the list reflows (fonts loading, breakpoint changes that
    // toggle the desktop aside between display:none and flex).
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  const activeSet = new Set(active);
  const thumb = geometry ? thumbRange(entries, activeSet, geometry.bounds) : null;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    // Shareable hash without flooding history with a back-entry per heading.
    history.replaceState(null, '', `#${id}`);
    onNavigate?.();
  };

  return (
    <nav aria-label="On this page" className={cn('relative text-sm', className)}>
      {geometry && (
        <TocThumb
          width={geometry.width}
          height={geometry.height}
          path={geometry.path}
          thumb={thumb}
        />
      )}
      <ul ref={listRef} className="relative">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
          >
            <a
              href={`#${entry.id}`}
              data-active={activeSet.has(entry.id) || undefined}
              onClick={(event) => handleClick(event, entry.id)}
              style={{ paddingLeft: itemPaddingLeft(entry.level) }}
              className="text-muted-foreground hover:text-foreground data-[active]:text-foreground block py-1.5 leading-snug transition-colors"
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Vertical span covering every active item, or `null` when none are active. */
function thumbRange(
  entries: { id: string }[],
  activeSet: Set<string>,
  bounds: { top: number; height: number }[],
): ThumbRange | null {
  const activeIndexes = entries
    .map((entry, index) => (activeSet.has(entry.id) ? index : -1))
    .filter((index) => index !== -1);
  if (activeIndexes.length === 0) return null;
  const first = bounds[activeIndexes[0]];
  const last = bounds[activeIndexes[activeIndexes.length - 1]];
  return { top: first.top, bottom: last.top + last.height };
}

/**
 * Responsive shell placed once per article. On wide screens the TOC is fixed in
 * the gutter just right of the centered article; below `xl` — where that gutter
 * collapses — it becomes a floating "On this page" button opening the same list
 * in a popover. Renders nothing when the article has no h2/h3 headings.
 */
export function PageTableOfContents({ toc }: { toc: TableOfContentsData }) {
  const [open, setOpen] = useState(false);
  const hasEntries = useMemo(() => normalizeEntries(toc).length > 0, [toc]);
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
