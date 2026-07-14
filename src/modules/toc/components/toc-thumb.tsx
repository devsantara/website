import type { ThumbRange } from '#/modules/toc/toc.types';

interface TocThumbProps {
  width: number;
  height: number;
  /** SVG path threading through every TOC item, shared by both layers. */
  path: string;
  /** Active span to reveal, or `null` to show only the faint rail. */
  thumb: ThumbRange | null;
}

/**
 * The rail behind the TOC list: the same path drawn twice. The lower layer is a
 * faint full-length line; the upper layer is the accented "thumb", identical but
 * clipped with an inset `clip-path` to the active vertical span. Animating only
 * the clip inset (not the geometry) lets the highlight glide along the shared
 * curve as the active range grows, shrinks, and moves — the technique from
 * fuma-nama.dev's SVG posts, recolored to this project's monochrome palette.
 */
export function TocThumb({ width, height, path, thumb }: TocThumbProps) {
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
      {thumb && (
        <path
          d={path}
          strokeWidth={1}
          className="stroke-foreground transition-[clip-path] duration-300 ease-out motion-reduce:transition-none"
          style={{ clipPath: `inset(${thumb.top}px 0 ${Math.max(0, height - thumb.bottom)}px 0)` }}
        />
      )}
    </svg>
  );
}
