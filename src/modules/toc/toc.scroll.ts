import * as React from 'react';

import type { TocEntry } from '#/modules/toc/toc.entries';

/** What the reader can currently see, derived from the window scroll position. */
export interface ScrollSpyState {
  /** Ids of the headings whose section is on screen, in document order. */
  activeIds: string[];
  /** The reading position is still above the first heading (the intro). */
  atStart: boolean;
  /** The end of the article's content has scrolled into view. */
  atEnd: boolean;
}

const NOTHING_VISIBLE: ScrollSpyState = { activeIds: [], atStart: false, atEnd: false };

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Whether two spy states hold the same boundary flags and ids, in order. */
function sameSpyState(a: ScrollSpyState, b: ScrollSpyState): boolean {
  return (
    a.atStart === b.atStart &&
    a.atEnd === b.atEnd &&
    a.activeIds.length === b.activeIds.length &&
    a.activeIds.every((id, index) => id === b.activeIds[index])
  );
}

/**
 * One measurement of the reading position, from live layout.
 *
 * A heading's section runs from its own top down to the next heading's top —
 * and the last section down to the end of the article — so the sections tile
 * the whole content region. A heading is active while its section overlaps the
 * active band: the viewport, inset at the top so a heading that was just
 * scrolled to (via a TOC link or `#` fragment) reads as active immediately
 * instead of the section above it staying highlighted a moment longer. The
 * inset is derived from the heading's `scroll-margin-top` (see markdown.css),
 * doubled to clear it with room to spare.
 *
 * Above the first heading or below the article's content no section overlaps,
 * so `activeIds` is empty: the highlight only shows while article content is
 * actually on screen. Alongside it, the two boundary states: `atStart` while
 * the reading position is still above the first heading, and `atEnd` once the
 * article's content bottom has scrolled into the viewport — the reader can see
 * the end. Either can overlap with active headings.
 */
function measureScrollSpy(ids: string[]): ScrollSpyState {
  const viewportHeight = window.innerHeight;
  const firstHeading = document.getElementById(ids[0]);
  const headingTops = ids.map((id) => {
    const heading = document.getElementById(id);
    return heading ? heading.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
  });

  // Top edge of the active band. Falls back to the viewport edge when the
  // first heading isn't in the DOM yet, matching the `article` fallback below.
  const bandTop = firstHeading ? parseFloat(getComputedStyle(firstHeading).scrollMarginTop) * 2 : 0;

  // Cap the last heading's section at the end of the article so the highlight
  // clears once the content scrolls out of view, instead of clinging to the
  // final heading while the footer below it is on screen. Falls back to
  // +Infinity if the article wrapper isn't found, extending the last section
  // indefinitely.
  const article = firstHeading?.closest('article');
  const contentBottom = article ? article.getBoundingClientRect().bottom : Number.POSITIVE_INFINITY;

  const activeIds: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const sectionTop = headingTops[i];
    const sectionBottom = i + 1 < ids.length ? headingTops[i + 1] : contentBottom;
    // The section [sectionTop, sectionBottom) overlaps the band [bandTop, viewportHeight).
    if (sectionTop < viewportHeight && sectionBottom > bandTop) activeIds.push(ids[i]);
  }

  return {
    activeIds,
    atStart: headingTops[0] > bandTop,
    atEnd: contentBottom <= viewportHeight,
  };
}

/**
 * Tracks which headings' sections are currently on screen (see
 * {@link measureScrollSpy}), in document order, so the TOC can highlight the
 * full visible range rather than a single anchor.
 *
 * Reads live layout on scroll/resize (coalesced into an animation frame)
 * instead of caching offsets, so it stays correct as images load and reflow
 * the article. `entries` must be referentially stable across renders (memoize
 * at the call site) — it keys the effect.
 */
export function useScrollSpy(entries: TocEntry[]): ScrollSpyState {
  const [spy, setSpy] = React.useState<ScrollSpyState>(NOTHING_VISIBLE);

  React.useEffect(() => {
    if (entries.length === 0) {
      setSpy(NOTHING_VISIBLE);
      return;
    }

    const ids = entries.map((entry) => entry.id);
    let frame = 0;

    const update = () => {
      frame = 0;
      const next = measureScrollSpy(ids);
      setSpy((previous) => (sameSpyState(previous, next) ? previous : next));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [entries]);

  return spy;
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
 * Keeps the active TOC link centered in its own scroll container. A long
 * article's list can outgrow the fixed desktop aside (or the sheet/drawer), so
 * as the reader scrolls the page the container scrolls in step to hold the
 * highlighted link on its vertical midline. The browser clamps this at the
 * ends, so the first and last links still rest against the container's edges
 * rather than being forced past them to reach the center.
 *
 * Scrolls only the nearest scrollable ancestor — never the window — so keeping
 * pace with the reader inside the gutter can't nudge the article's own scroll
 * position. A no-op while the list fits (the ancestor search skips containers
 * tall enough to show everything) and while nothing is active (`activeId` of
 * `undefined`).
 */
export function useKeepActiveInView(
  linkRefs: React.RefObject<Map<string, HTMLElement>>,
  activeId: string | undefined,
): void {
  React.useEffect(() => {
    if (!activeId) return;
    const link = linkRefs.current.get(activeId);
    if (!link) return;

    const container = scrollableAncestor(link);
    if (!container) return;

    const linkRect = link.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // Shift the container so the active link's midline meets the container's.
    const delta =
      linkRect.top + linkRect.height / 2 - (containerRect.top + container.clientHeight / 2);
    if (Math.round(delta) === 0) return;

    container.scrollBy({ top: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [linkRefs, activeId]);
}

/**
 * Scrolls the page to a heading the way a TOC link should: smoothly (unless
 * the reader prefers reduced motion) and with the URL hash updated in place —
 * `replaceState`, not a navigation — so the address stays shareable without
 * flooding history with a back-entry per visited heading.
 */
export function scrollToHeading(heading: HTMLElement): void {
  heading.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
  history.replaceState(null, '', `#${heading.id}`);
}
