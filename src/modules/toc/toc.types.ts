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

/** One TOC item's slice of the rail: its column `x` and vertical extent, in px. */
export interface ThreadItem {
  x: number;
  top: number;
  bottom: number;
}

/** Vertical extent of one rendered TOC item within the list, in px. */
export interface ItemBounds {
  top: number;
  height: number;
}

/** Measured layout of the rendered list, in px, driving the SVG rail. */
export interface RailGeometry {
  width: number;
  height: number;
  path: string;
  bounds: ItemBounds[];
}

/** Vertical span, in px, the highlighted thumb should cover along the rail. */
export interface ThumbRange {
  top: number;
  bottom: number;
}
