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

/** A point along the rail, in px, in the SVG's coordinate space. */
export interface RailPoint {
  x: number;
  y: number;
}

/** Scroll-derived state of the headings, from `useActiveHeadings`. */
export interface ActiveHeadings {
  /** Ids of the headings currently on screen, in document order. */
  ids: string[];
  /** The reading position is still above the first heading. */
  atStart: boolean;
  /** The end of the article's content has scrolled into view. */
  atEnd: boolean;
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
  /** Where the rail path begins and ends — the boundary dots sit here. */
  start: RailPoint;
  end: RailPoint;
  bounds: ItemBounds[];
}

/** Vertical span, in px, the highlighted thumb should cover along the rail. */
export interface ThumbRange {
  top: number;
  bottom: number;
}
