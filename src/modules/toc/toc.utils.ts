import type { TableOfContents } from '#/modules/markdown/markdown.types';
import type { ItemBounds, ThreadItem, ThumbRange, TocEntry } from '#/modules/toc/toc.types';

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

// How far, in px, the diagonal that steps between columns extends above and
// below the shared edge between two items. Keeping the bend this close to the
// edge lets the thumb clip pull in by the same amount to hide a bend into an
// inactive neighbor (see thumbRange below). Capped so the diagonal never
// reaches past either item's midline when items are short.
const BEND_INSET = 8;

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

/**
 * Vertical span covering every active item, or `null` when none are active.
 * The span pulls in by `BEND_INSET` at both ends: the rail's bends sit within
 * that distance of the edge between two items, so a lone active item reads as
 * a straight line and a bend only shows when the items on both of its sides
 * are active. Trimming both ends unconditionally — not just beside a bend —
 * keeps every thumb the same height and centered on its items regardless of
 * the neighbors' indent.
 */
export function thumbRange(
  entries: TocEntry[],
  activeSet: Set<string>,
  bounds: ItemBounds[],
): ThumbRange | null {
  const activeIndexes = entries
    .map((entry, index) => (activeSet.has(entry.id) ? index : -1))
    .filter((index) => index !== -1);
  if (activeIndexes.length === 0) return null;
  const first = bounds[activeIndexes[0]];
  const last = bounds[activeIndexes[activeIndexes.length - 1]];
  return {
    top: first.top + BEND_INSET,
    bottom: last.top + last.height - BEND_INSET,
  };
}
