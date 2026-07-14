import * as React from 'react';

import type { ActiveHeadings, RailGeometry, TocEntry } from '#/modules/toc/toc.types';
import { buildThreadPath, threadX } from '#/modules/toc/toc.utils';

/** Whether two scroll states hold the same boundary flags and ids, in order. */
function sameActive(a: ActiveHeadings, b: ActiveHeadings): boolean {
  return (
    a.atStart === b.atStart &&
    a.atEnd === b.atEnd &&
    a.ids.length === b.ids.length &&
    a.ids.every((id, index) => id === b.ids[index])
  );
}

const NOTHING_ACTIVE: ActiveHeadings = { ids: [], atStart: false, atEnd: false };

/**
 * Tracks which headings are currently on screen, in document order, so the rail
 * thumb can span the full visible range rather than a single anchor.
 *
 * A heading's section runs from its own top down to the next heading's top — and
 * the last section down to the end of the article — so the bands tile the whole
 * content region. A heading counts as visible when its band overlaps the active
 * band: the viewport, inset at the top by the heading `scroll-margin-top` so a
 * heading highlights exactly as navigating to it settles it onto that line.
 * Above the first heading or below the article's content nothing overlaps, so the
 * result is empty and the thumb hides: the highlight only shows while article
 * content is actually on screen.
 *
 * Alongside the visible ids, reports the two boundary states the rail's dots
 * mark: `atStart` while the reading position is still above the first heading
 * (the first heading's top hasn't crossed the active band's top edge), and
 * `atEnd` once the article's content bottom has scrolled into the viewport —
 * the reader can see the end.
 *
 * Reads live layout on scroll/resize (coalesced into an animation frame) instead
 * of caching offsets, so it stays correct as images load and reflow the article.
 * `ids` must be referentially stable across renders (memoize at the call site) —
 * it keys the effect.
 */
export function useActiveHeadings(ids: string[]): ActiveHeadings {
  const [active, setActive] = React.useState<ActiveHeadings>(NOTHING_ACTIVE);

  React.useEffect(() => {
    if (ids.length === 0) {
      setActive(NOTHING_ACTIVE);
      return;
    }

    let frame = 0;

    const compute = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const firstHeading = document.getElementById(ids[0]);
      const tops = ids.map((id) => {
        const element = document.getElementById(id);
        return element ? element.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      });

      // Insets the active band's top edge below the viewport edge, so a heading
      // that was just scrolled to (via a TOC link or `#` fragment) reads as
      // active immediately instead of the section above it staying highlighted
      // a moment longer. A fixed value, not read from the heading's
      // `scroll-margin-top` (see markdown.css) — just chosen to clear it with
      // room to spare. Falls back to no inset when the first heading isn't in
      // the DOM yet, matching the `article` fallback below.
      const offset = firstHeading
        ? parseFloat(getComputedStyle(firstHeading).scrollMarginTop) * 2
        : 0;

      // Cap the last heading's section at the end of the article so the highlight
      // clears once the content scrolls out of view, instead of clinging to the
      // final heading while the footer below it is on screen. Falls back to
      // +Infinity if the article wrapper isn't found, preserving the old span.
      const article = firstHeading?.closest('article');
      const contentBottom = article
        ? article.getBoundingClientRect().bottom
        : Number.POSITIVE_INFINITY;

      const visible: string[] = [];
      for (let i = 0; i < ids.length; i++) {
        const top = tops[i];
        const nextTop = i + 1 < ids.length ? tops[i + 1] : contentBottom;
        // The section [top, nextTop) overlaps the active band [offset, viewportHeight).
        if (top < viewportHeight && nextTop > offset) visible.push(ids[i]);
      }

      // The boundary dots' states. Either can overlap with visible headings —
      // the first heading activates as it enters the viewport bottom while the
      // reading position is still in the intro, and the last section stays
      // active while the article's end is on screen.
      const atStart = tops[0] > offset;
      const atEnd = contentBottom <= viewportHeight;

      const next: ActiveHeadings = { ids: visible, atStart, atEnd };
      setActive((previous) => (sameActive(previous, next) ? previous : next));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);

  return active;
}

/** The nearest ancestor that actually scrolls vertically, or null if none does. */
function scrollableAncestor(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return null;
}

/**
 * Keeps the active TOC item centered in its own scroll container. A long
 * article's list can outgrow the fixed desktop aside (or the mobile popover), so
 * as the reader scrolls the page the container scrolls in step to hold the
 * highlighted section on its vertical midline. The browser clamps this at the
 * ends, so the first and last items still rest against the container's edges
 * rather than being forced past them to reach the center.
 *
 * Scrolls only the nearest scrollable ancestor — never the window — so keeping
 * pace with the reader inside the gutter can't nudge the article's own scroll
 * position. A no-op while the list fits (the ancestor search skips containers
 * tall enough to show everything) and while nothing is active (`activeIndex` of
 * -1). Pass the same `itemRefs` attached to the `<li>`s, in `entries` order.
 */
export function useScrollActiveIntoView(
  itemRefs: React.RefObject<(HTMLLIElement | null)[]>,
  activeIndex: number,
): void {
  React.useEffect(() => {
    if (activeIndex < 0) return;
    const item = itemRefs.current[activeIndex];
    if (!item) return;

    const container = scrollableAncestor(item);
    if (!container) return;

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // Shift the container so the active item's midline meets the container's.
    const delta =
      itemRect.top + itemRect.height / 2 - (containerRect.top + container.clientHeight / 2);
    if (Math.round(delta) === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollBy({ top: delta, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [itemRefs, activeIndex]);
}

/**
 * Measures the rendered TOC list to produce the {@link RailGeometry} driving
 * the SVG rail. The layout only exists after mount, so the rail starts `null` —
 * callers render just the links until then, keeping server and first client
 * render identical — and is re-measured on reflow (fonts loading, breakpoint
 * changes that toggle the desktop aside between display:none and flex).
 *
 * Attach `listRef` to the `<ul>` and `itemRefs.current[index]` to each `<li>`,
 * in `entries` order.
 */
export function useRailGeometry(entries: TocEntry[]): {
  listRef: React.RefObject<HTMLUListElement | null>;
  itemRefs: React.RefObject<(HTMLLIElement | null)[]>;
  rail: RailGeometry | null;
} {
  const listRef = React.useRef<HTMLUListElement>(null);
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const [rail, setRail] = React.useState<RailGeometry | null>(null);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || entries.length === 0) return;

    const measure = () => {
      const bounds = entries.map((_, index) => {
        const element = itemRefs.current[index];
        return element
          ? { top: element.offsetTop, height: element.offsetHeight }
          : { top: 0, height: 0 };
      });
      const items = entries.map((entry, index) => ({
        x: threadX(entry.level),
        top: bounds[index].top,
        bottom: bounds[index].top + bounds[index].height,
      }));
      const first = items[0];
      const last = items[items.length - 1];
      setRail({
        width: list.offsetWidth,
        height: list.offsetHeight,
        path: buildThreadPath(items),
        start: { x: first.x, y: first.top },
        end: { x: last.x, y: last.bottom },
        bounds,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [entries]);

  return { listRef, itemRefs, rail };
}
