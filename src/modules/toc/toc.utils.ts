import type { TableOfContents } from '#/modules/markdown/markdown.types';

/**
 * A table-of-contents entry prepared for rendering: the raw heading's `id` and
 * `title`, plus a `level` normalized so the shallowest kept heading sits at 0.
 * Normalizing (rather than using the raw `depth`) means a document whose
 * headings start at `h3` still renders flush-left instead of pre-indented.
 */
export interface TocEntry {
  id: string;
  title: string;
  level: number;
}

// Only h2/h3 make it into the rail — deeper headings would over-nest the
// narrow gutter, and h1 is the page title, rendered outside the MDX body.
const MIN_DEPTH = 2;
const MAX_DEPTH = 3;

/**
 * Keeps the h2/h3 headings and normalizes their depth to a 0-based `level`
 * relative to the shallowest heading present, so indentation is consistent
 * regardless of which level a document happens to start at. Returns `[]` when
 * nothing qualifies, so callers can render nothing rather than an empty rail.
 */
export function normalizeEntries(toc: TableOfContents): TocEntry[] {
  const kept = toc.filter((entry) => entry.depth >= MIN_DEPTH && entry.depth <= MAX_DEPTH);
  if (kept.length === 0) return [];
  const minDepth = Math.min(...kept.map((entry) => entry.depth));
  return kept.map((entry) => ({
    id: entry.id,
    title: entry.title,
    level: entry.depth - minDepth,
  }));
}

// Geometry of the SVG rail, in px (its viewBox maps 1:1 to rendered pixels).
// The thread sits in each item's left padding; both step right by INDENT per
// level so the line and the text indent together.
const THREAD_X_BASE = 2;
const ITEM_PADDING_BASE = 18;
const INDENT = 12;

/** Horizontal position of the rail for a heading at `level`. */
export function threadX(level: number): number {
  return THREAD_X_BASE + level * INDENT;
}

/** Left padding of a TOC link at `level`, keeping its text clear of the rail. */
export function itemPaddingLeft(level: number): number {
  return ITEM_PADDING_BASE + level * INDENT;
}

export interface Point {
  x: number;
  y: number;
}

// How far, in px, the rail runs straight down before and after the diagonal that
// steps between columns. Kept small relative to the gap so the rail stays
// vertical through most of a stepping segment and only angles across near the
// middle. Capped below half the gap so the two vertical runs never overlap (and
// the corners never invert) when items sit close together.
const BEND_INSET = 8;

/**
 * Builds the SVG path that threads through each item's point in order. Segments
 * between items at the same indent are straight verticals; a step to a different
 * indent leaves the previous column heading straight down, cuts across on a
 * straight diagonal, then arrives at the next column heading straight down. The
 * three segments meet at sharp corners — no rounding — so the bend reads as a
 * crisp edge rather than a curve.
 */
export function buildThreadPath(points: Point[]): string {
  if (points.length === 0) return '';
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    if (current.x === previous.x) {
      path += ` L${current.x} ${current.y}`;
      continue;
    }
    const inset = Math.min(BEND_INSET, (current.y - previous.y) * 0.4);
    path += ` L${previous.x} ${previous.y + inset} L${current.x} ${current.y - inset} L${current.x} ${current.y}`;
  }
  return path;
}
