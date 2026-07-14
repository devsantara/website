import * as React from 'react';

import type { RailGeometry, TocEntry } from '#/modules/toc/toc.types';
import { buildThreadPath, threadX } from '#/modules/toc/toc.utils';

/** Whether two id lists hold the same ids in the same order. */
function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

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
 * Reads live layout on scroll/resize (coalesced into an animation frame) instead
 * of caching offsets, so it stays correct as images load and reflow the article.
 * `ids` must be referentially stable across renders (memoize at the call site) —
 * it keys the effect.
 */
export function useActiveHeadings(ids: string[]): string[] {
  const [active, setActive] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (ids.length === 0) {
      setActive([]);
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

      // No band overlaps: we're above the first heading or past the article's
      // content, so nothing is active and the thumb hides.
      setActive((previous) => (sameOrder(previous, visible) ? previous : visible));
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
      setRail({
        width: list.offsetWidth,
        height: list.offsetHeight,
        path: buildThreadPath(items),
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
