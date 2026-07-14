import * as React from 'react';

import type { TableOfContents as TableOfContentsData } from '#/modules/markdown/markdown.types';
import {
  useActiveHeadings,
  useRailGeometry,
  useScrollActiveIntoView,
} from '#/modules/toc/toc.hooks';
import { itemPaddingLeft, normalizeEntries, thumbRange } from '#/modules/toc/toc.utils';
import { cn } from '#/ui/utils';

import { TocThumb } from './toc-thumb';

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
 * inside the mobile popover by `PageTableOfContents`.
 */
export function TableOfContents({ toc, className, onNavigate }: TableOfContentsProps) {
  const entries = React.useMemo(() => normalizeEntries(toc), [toc]);
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries]);
  const active = useActiveHeadings(ids);
  const { listRef, itemRefs, rail } = useRailGeometry(entries);

  // Follow the topmost active heading — the section being read — so the TOC
  // scrolls to it when it drops below the container's own fold.
  const activeIndex =
    active.ids.length > 0 ? entries.findIndex((entry) => entry.id === active.ids[0]) : -1;
  useScrollActiveIntoView(itemRefs, activeIndex);

  if (entries.length === 0) return null;

  const activeSet = new Set(active.ids);
  const thumb = rail ? thumbRange(entries, active, rail.bounds) : null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
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
      {rail && (
        <TocThumb
          width={rail.width}
          height={rail.height}
          path={rail.path}
          thumb={thumb}
          start={rail.start}
          end={rail.end}
        />
      )}
      <ul ref={listRef} className="relative p-1">
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
