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

/** One TOC item's slice of the rail: its column `x` and vertical extent, in px. */
export interface ThreadItem {
  x: number;
  top: number;
  bottom: number;
}

// How far, in px, the diagonal that steps between columns extends above and
// below the shared edge between two items. Keeping the bend this close to the
// edge lets the thumb clip pull in by the same amount to hide a bend into an
// inactive neighbor (see thumbRange in table-of-contents.tsx). Capped so the
// diagonal never reaches past either item's midline when items are short.
export const BEND_INSET = 8;

/**
 * Builds the SVG path that threads through each item's vertical extent in
 * order. Runs between items at the same indent are straight verticals; a step
 * to a different indent stays vertical until just above the items' shared
 * edge, cuts across on a straight diagonal centered on that edge, then resumes
 * vertical just below it. The segments meet at sharp corners — no rounding —
 * so the bend reads as a crisp edge rather than a curve.
 */
export function buildThreadPath(items: ThreadItem[]): string {
  if (items.length === 0) return '';
  let path = `M${items[0].x} ${items[0].top}`;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const next = items[i + 1];
    if (!next || next.x === item.x) {
      path += ` L${item.x} ${item.bottom}`;
      continue;
    }
    const edge = (item.bottom + next.top) / 2;
    const inset = Math.min(BEND_INSET, (edge - item.top) * 0.4, (next.bottom - edge) * 0.4);
    path += ` L${item.x} ${edge - inset} L${next.x} ${edge + inset}`;
  }
  return path;
}
