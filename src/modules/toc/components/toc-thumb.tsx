import type { RailPoint, ThumbRange } from '#/modules/toc/toc.types';
import { DOT_RADIUS } from '#/modules/toc/toc.utils';

interface TocThumbProps {
  width: number;
  height: number;
  /** SVG path threading through every TOC item, shared by both layers. */
  path: string;
  /** Span of the rail to accent (see `thumbRange`), or `null` for none. */
  thumb: ThumbRange | null;
  /** Endpoints of the rail path, where the boundary dots sit. */
  start: RailPoint;
  end: RailPoint;
}

/**
 * The rail behind the TOC list: a faint layer — the full-length line plus a
 * dot at each end — under an identical accented layer clipped with an animated
 * inset `clip-path` to the active span. Animating only the clip inset (not the
 * geometry) lets the highlight glide along the shared curve, and — since the
 * dots live in the clipped layer too — morph continuously between dot and line
 * at the boundaries. The technique from fuma-nama.dev's SVG posts, recolored
 * to this project's monochrome palette.
 */
export function TocThumb({ width, height, path, thumb, start, end }: TocThumbProps) {
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      <path d={path} strokeWidth={1} className="stroke-border" />
      <circle cx={start.x} cy={start.y} r={DOT_RADIUS} className="fill-border" />
      <circle cx={end.x} cy={end.y} r={DOT_RADIUS} className="fill-border" />
      {thumb && (
        <g
          className="transition-[clip-path] duration-300 ease-out motion-reduce:transition-none"
          // `view-box` measures the inset from the SVG's coordinates (the
          // default box is this group's bounding box, inflated by the dots);
          // the negative insets reach the dots' overhang past the viewBox.
          style={{
            clipPath: `inset(${thumb.top}px ${-DOT_RADIUS}px ${height - thumb.bottom}px ${-DOT_RADIUS}px) view-box`,
          }}
        >
          <path d={path} strokeWidth={1} className="stroke-foreground" />
          <circle cx={start.x} cy={start.y} r={DOT_RADIUS} className="fill-foreground" />
          <circle cx={end.x} cy={end.y} r={DOT_RADIUS} className="fill-foreground" />
        </g>
      )}
    </svg>
  );
}
