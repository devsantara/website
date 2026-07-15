import * as React from 'react';

import type { TocEntry } from '#/modules/toc/toc.entries';
import type { ScrollSpyState } from '#/modules/toc/toc.scroll';

/** A point along the rail, in px, in the SVG's coordinate space. */
export interface RailPoint {
  x: number;
  y: number;
}

/** A vertical span along the rail, in px. */
export interface RailSpan {
  top: number;
  bottom: number;
}

/** One link's slice of the rail: its column `x` and vertical extent, in px. */
export interface RailSlot {
  id: string;
  x: number;
  top: number;
  bottom: number;
}

/** Measured layout of a rendered TOC list, in px, driving the SVG rail. */
export interface RailGeometry {
  width: number;
  height: number;
  /** SVG path threading through every slot — the full-length track. */
  path: string;
  /** Where the track begins and ends — the boundary dots sit here. */
  start: RailPoint;
  end: RailPoint;
  /** Per rendered link, in list order. */
  slots: RailSlot[];
}

// Geometry of the SVG rail, in px (its viewBox maps 1:1 to rendered pixels).
// The rail sits in each link's left padding; both step right by LEVEL_INDENT
// per level so the line and the text indent together.
const RAIL_X_BASE = 3;
const LINK_INDENT_BASE = 18;
const LEVEL_INDENT = 12;

/** Horizontal position of the rail for a heading at `level`. */
export function railX(level: number): number {
  return RAIL_X_BASE + level * LEVEL_INDENT;
}

/** Left padding of a TOC link at `level`, keeping its text clear of the rail. */
export function linkIndent(level: number): number {
  return LINK_INDENT_BASE + level * LEVEL_INDENT;
}

// How far, in px, the diagonal that steps between columns extends above and
// below the shared edge between two links. Keeping the bend this close to the
// edge lets the highlight pull in by the same amount to hide a bend into an
// inactive neighbor (see highlightSpan below). Capped so the diagonal never
// reaches past either link's midline when links are short.
const BEND_INSET = 8;

/**
 * Builds the SVG path that threads through each slot's vertical extent in
 * order. Runs between links at the same indent are straight verticals; a step
 * to a different indent stays vertical until just above the links' shared
 * edge, cuts across on a straight diagonal centered on that edge, then resumes
 * vertical just below it. The segments meet at sharp corners — no rounding —
 * so the bend reads as a crisp edge rather than a curve.
 */
export function buildRailPath(slots: RailSlot[]): string {
  if (slots.length === 0) return '';
  let path = `M${slots[0].x} ${slots[0].top}`;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const next = slots[i + 1];
    if (!next || next.x === slot.x) {
      path += ` L${slot.x} ${slot.bottom}`;
      continue;
    }
    const edge = (slot.bottom + next.top) / 2;
    const inset = Math.min(BEND_INSET, (edge - slot.top) * 0.4, (next.bottom - edge) * 0.4);
    path += ` L${slot.x} ${edge - inset} L${next.x} ${edge + inset}`;
  }
  return path;
}

/** Radius, in px, of the dots terminating the rail. */
export const DOT_RADIUS = 2.5;

/** The span a boundary dot occupies around its center `y`. */
function dotSpan(y: number): RailSpan {
  return { top: y - DOT_RADIUS, bottom: y + DOT_RADIUS };
}

/**
 * Vertical span of the rail to accent, or `null` when nothing is active.
 * The active links' span pulls in by `BEND_INSET` at both ends: the rail's
 * bends sit within that distance of the edge between two links, so a lone
 * active link reads as a straight line and a bend only shows when the links on
 * both of its sides are active. Trimming both ends unconditionally — not just
 * beside a bend — keeps every highlight the same height and centered on its
 * links regardless of the neighbors' indent.
 *
 * While a boundary state holds, the span stretches over that end's dot, so the
 * highlight morphs continuously between dot and line as the reader crosses the
 * article's edges. The spans are contiguous by construction — a lit dot always
 * abuts the active range — so one window covers them all.
 */
export function highlightSpan(geometry: RailGeometry, spy: ScrollSpyState): RailSpan | null {
  const activeIds = new Set(spy.activeIds);
  const activeSlots = geometry.slots.filter((slot) => activeIds.has(slot.id));

  const spans: RailSpan[] = [];
  if (spy.atStart) spans.push(dotSpan(geometry.start.y));
  if (activeSlots.length > 0) {
    const first = activeSlots[0];
    const last = activeSlots[activeSlots.length - 1];
    spans.push({ top: first.top + BEND_INSET, bottom: last.bottom - BEND_INSET });
  }
  if (spy.atEnd) spans.push(dotSpan(geometry.end.y));

  if (spans.length === 0) return null;
  return { top: spans[0].top, bottom: spans[spans.length - 1].bottom };
}

/**
 * Measures a rendered TOC list to produce the {@link RailGeometry} driving the
 * SVG rail. The layout only exists after mount, so the geometry starts `null`
 * — callers render just the links until then, keeping server and first client
 * render identical — and is re-measured on reflow (fonts loading, breakpoint
 * changes toggling a tier between `display:none` and visible).
 *
 * `list` must be the links' offset parent (position it), and `linkRefs` maps
 * each entry's id to its rendered `<li>`; entries without a rendered link are
 * skipped, so a list rendering a subset of entries still gets a correct rail.
 */
export function useRailGeometry(
  listRef: React.RefObject<HTMLElement | null>,
  linkRefs: React.RefObject<Map<string, HTMLElement>>,
  entries: TocEntry[],
): RailGeometry | null {
  const [geometry, setGeometry] = React.useState<RailGeometry | null>(null);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || entries.length === 0) {
      setGeometry(null);
      return;
    }

    const measure = () => {
      // A hidden tier (the responsive shell keeps two of its three tiers
      // display:none) measures 0×0 — report no geometry rather than a
      // degenerate rail; the observer re-measures once it becomes visible.
      if (list.offsetHeight === 0) {
        setGeometry(null);
        return;
      }

      const slots: RailSlot[] = [];
      for (const entry of entries) {
        const link = linkRefs.current.get(entry.id);
        if (!link) continue;
        slots.push({
          id: entry.id,
          x: railX(entry.level),
          top: link.offsetTop,
          bottom: link.offsetTop + link.offsetHeight,
        });
      }
      if (slots.length === 0) {
        setGeometry(null);
        return;
      }

      const first = slots[0];
      const last = slots[slots.length - 1];
      setGeometry({
        width: list.offsetWidth,
        height: list.offsetHeight,
        path: buildRailPath(slots),
        start: { x: first.x, y: first.top },
        end: { x: last.x, y: last.bottom },
        slots,
      });
    };

    // ResizeObserver delivers an initial notification on observe(), which
    // performs the first measure; reflows re-run it from live layout.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, linkRefs, entries]);

  return geometry;
}
