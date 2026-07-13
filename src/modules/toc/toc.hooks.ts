'use client';

import { useEffect, useState } from 'react';

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
 * A heading's section runs from its own top down to the next heading's top; it
 * counts as visible when that band overlaps the viewport. When nothing overlaps
 * (mid-scroll between two sections, or above the first heading), it falls back
 * to the nearest heading at or above the top so the thumb never disappears.
 *
 * Reads live layout on scroll/resize (coalesced into an animation frame) instead
 * of caching offsets, so it stays correct as images load and reflow the article.
 * `ids` must be referentially stable across renders (memoize at the call site) —
 * it keys the effect.
 */
export function useActiveHeadings(ids: string[]): string[] {
  const [active, setActive] = useState<string[]>([]);

  useEffect(() => {
    if (ids.length === 0) {
      setActive([]);
      return;
    }

    let frame = 0;

    const compute = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const tops = ids.map((id) => {
        const element = document.getElementById(id);
        return element ? element.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      });

      const visible: string[] = [];
      for (let i = 0; i < ids.length; i++) {
        const top = tops[i];
        const nextTop = i + 1 < ids.length ? tops[i + 1] : Number.POSITIVE_INFINITY;
        // The section [top, nextTop) overlaps the viewport [0, viewportHeight).
        if (top < viewportHeight && nextTop > 0) visible.push(ids[i]);
      }

      if (visible.length === 0) {
        // Nothing straddles the viewport: highlight the last heading scrolled
        // past, or the first one when we're still above it.
        let index = 0;
        for (let i = 0; i < ids.length; i++) {
          if (tops[i] <= 0) index = i;
        }
        visible.push(ids[index]);
      }

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
