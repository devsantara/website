import type { TableOfContents } from '#/modules/markdown/markdown.types';

/**
 * One entry of the rendered table of contents: a heading the reader can jump
 * to. `level` is indentation depth, not the raw heading depth — the shallowest
 * kept heading sits at 0, so a document whose headings start at `h3` still
 * renders flush-left instead of pre-indented.
 */
export interface TocEntry {
  /** Slug of the rendered heading element — deep-link to it with `#${id}`. */
  id: string;
  /** The heading's plain text, shown as the link label. */
  label: string;
  /** Indentation depth: 0 for the shallowest kept heading. */
  level: number;
}

// Only h2/h3 make the cut — deeper headings would over-nest the narrow
// gutter, and h1 is the page title, rendered outside the MDX body.
const MIN_DEPTH = 2;
const MAX_DEPTH = 3;

/**
 * Turns a document's raw headings into renderable {@link TocEntry} items:
 * keeps the h2/h3 headings and normalizes their depth to a 0-based `level`
 * relative to the shallowest heading present. Returns `[]` when nothing
 * qualifies, so callers can skip the TOC entirely rather than render an empty
 * shell.
 */
export function parseTocEntries(headings: TableOfContents): TocEntry[] {
  const kept = headings.filter(
    (heading) => heading.depth >= MIN_DEPTH && heading.depth <= MAX_DEPTH,
  );
  if (kept.length === 0) return [];
  const minDepth = Math.min(...kept.map((heading) => heading.depth));
  return kept.map((heading) => ({
    id: heading.id,
    label: heading.title,
    level: heading.depth - minDepth,
  }));
}
