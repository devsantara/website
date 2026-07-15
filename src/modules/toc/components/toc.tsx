import * as React from 'react';

import type { TocEntry } from '#/modules/toc/toc.entries';
import type { RailGeometry } from '#/modules/toc/toc.rail';
import { DOT_RADIUS, highlightSpan, linkIndent, useRailGeometry } from '#/modules/toc/toc.rail';
import { scrollToHeading, useKeepActiveInView, useScrollSpy } from '#/modules/toc/toc.scroll';
import { cn } from '#/ui/utils';

/**
 * Composable "On this page" primitives. `TocRoot` owns the shared reading
 * state (one scroll spy, however many lists render under it); each `TocList`
 * renders one navigable list and measures its own layout for the `TocRail`
 * highlight. Compose them per surface:
 *
 * ```tsx
 * const entries = parseTocEntries(post.toc);
 *
 * <TocRoot entries={entries}>
 *   <TocList onNavigate={close}>
 *     <TocRail />
 *     {entries.map((entry) => (
 *       <TocLink key={entry.id} entry={entry} />
 *     ))}
 *   </TocList>
 * </TocRoot>
 * ```
 *
 * `ArticleToc` assembles these into the standard responsive shell.
 */

interface TocContextValue {
  /** The entries this TOC navigates, in document order. */
  entries: TocEntry[];
  /** Ids of the headings whose section is on screen, in document order. */
  activeIds: string[];
  /** The reading position is still above the first heading. */
  atStart: boolean;
  /** The end of the article's content has scrolled into view. */
  atEnd: boolean;
}

const TocContext = React.createContext<TocContextValue | null>(null);

/** The TOC's entries and live reading state, provided by {@link TocRoot}. */
export function useToc(): TocContextValue {
  const context = React.useContext(TocContext);
  if (!context) throw new Error('useToc must be used within <TocRoot>');
  return context;
}

interface TocRootProps {
  /**
   * Parsed entries (see `parseTocEntries`), referentially stable across
   * renders — memoize at the call site; they key the scroll spy.
   */
  entries: TocEntry[];
  children: React.ReactNode;
}

/**
 * Provides the entries and their scroll-derived reading state to every TOC
 * piece below it. Renders no DOM of its own, so one root can feed several
 * lists (the responsive shell mounts three) from a single scroll listener.
 */
export function TocRoot({ entries, children }: TocRootProps) {
  const spy = useScrollSpy(entries);
  const value = React.useMemo(() => ({ entries, ...spy }), [entries, spy]);
  return <TocContext.Provider value={value}>{children}</TocContext.Provider>;
}

interface TocListContextValue {
  /** Measured layout of this list, or `null` until it has one (see `useRailGeometry`). */
  geometry: RailGeometry | null;
  /** Registers a link's `<li>` under its entry id, for measurement and follow-scroll. */
  registerLink: (id: string, element: HTMLLIElement | null) => void;
  /** Click handler shared by every link: smooth-scrolls and reports navigation. */
  onLinkClick: (event: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

const TocListContext = React.createContext<TocListContextValue | null>(null);

function useTocList(): TocListContextValue {
  const context = React.useContext(TocListContext);
  if (!context) throw new Error('TOC list pieces must be used within <TocList>');
  return context;
}

interface TocListProps {
  className?: string;
  /** Called after a link scrolls the page — lets a sheet or drawer close. */
  onNavigate?: () => void;
  /** `TocLink`s (and optionally a `TocRail`). */
  children: React.ReactNode;
}

/**
 * One rendered TOC list: a `<nav>` around a `<ul>` of {@link TocLink}s. Owns
 * everything tied to this particular list instance — measuring its layout for
 * the rail, keeping the active link centered when the list scrolls, and
 * closing over `onNavigate` for its links — while the reading state comes from
 * the shared {@link TocRoot} above.
 */
export function TocList({ className, onNavigate, children }: TocListProps) {
  const { entries, activeIds } = useToc();
  const listRef = React.useRef<HTMLUListElement>(null);
  const linkRefs = React.useRef<Map<string, HTMLLIElement>>(new Map());

  const geometry = useRailGeometry(listRef, linkRefs, entries);
  useKeepActiveInView(linkRefs, activeIds[0]);

  const registerLink = React.useCallback((id: string, element: HTMLLIElement | null) => {
    if (element) linkRefs.current.set(id, element);
    else linkRefs.current.delete(id);
  }, []);

  const onLinkClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      const heading = document.getElementById(id);
      if (!heading) return; // fall back to the browser's default hash jump
      event.preventDefault();
      scrollToHeading(heading);
      onNavigate?.();
    },
    [onNavigate],
  );

  const value = React.useMemo(
    () => ({ geometry, registerLink, onLinkClick }),
    [geometry, registerLink, onLinkClick],
  );

  return (
    <nav aria-label="On this page" className={cn('relative text-sm', className)}>
      <TocListContext.Provider value={value}>
        {/* The list is the links' offset parent — rail coordinates hang off it. */}
        <ul ref={listRef} className="relative p-1">
          {children}
        </ul>
      </TocListContext.Provider>
    </nav>
  );
}

interface TocLinkProps {
  entry: TocEntry;
  /** Custom label content; defaults to the entry's heading text. */
  children?: React.ReactNode;
}

/**
 * One entry's link. Highlights itself while its section is on screen and
 * registers its element with the surrounding {@link TocList} so the rail and
 * follow-scroll know where it sits.
 */
export function TocLink({ entry, children }: TocLinkProps) {
  const { activeIds } = useToc();
  const { registerLink, onLinkClick } = useTocList();

  return (
    <li
      ref={(element) => {
        registerLink(entry.id, element);
      }}
    >
      <a
        href={`#${entry.id}`}
        data-active={activeIds.includes(entry.id) || undefined}
        onClick={(event) => onLinkClick(event, entry.id)}
        style={{ paddingLeft: linkIndent(entry.level) }}
        className="text-muted-foreground hover:text-foreground data-active:text-foreground block py-1.5 leading-snug transition-colors"
      >
        {children ?? entry.label}
      </a>
    </li>
  );
}

/**
 * The rail behind the list: a faint track — a line threading every link plus a
 * dot at each end — under an identical accented copy clipped with an animated
 * inset `clip-path` to the active span. Animating only the clip inset (not the
 * geometry) lets the highlight glide along the shared curve, and — since the
 * dots live in the clipped copy too — morph continuously between dot and line
 * at the boundaries. The technique from fuma-nama.dev's SVG posts, recolored
 * to this project's monochrome palette.
 *
 * Rendered as an absolutely positioned list item so it can sit inside the
 * `<ul>` — aligned with the coordinate space the links are measured in —
 * without affecting layout or the accessibility tree. Renders nothing until
 * the list has been measured.
 */
export function TocRail() {
  const { activeIds, atStart, atEnd } = useToc();
  const { geometry } = useTocList();
  if (!geometry) return null;

  const highlight = highlightSpan(geometry, { activeIds, atStart, atEnd });

  return (
    <li aria-hidden className="pointer-events-none absolute inset-0">
      <svg
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        fill="none"
        className="overflow-visible"
      >
        <RailShape geometry={geometry} className="text-border" />
        {highlight && (
          <g
            className="transition-[clip-path] duration-300 ease-out motion-reduce:transition-none"
            // `view-box` measures the inset from the SVG's coordinates (the
            // default box is this group's bounding box, inflated by the dots);
            // the negative insets reach the dots' overhang past the viewBox.
            style={{
              clipPath: `inset(${highlight.top}px ${-DOT_RADIUS}px ${geometry.height - highlight.bottom}px ${-DOT_RADIUS}px) view-box`,
            }}
          >
            <RailShape geometry={geometry} className="text-foreground" />
          </g>
        )}
      </svg>
    </li>
  );
}

/**
 * One monochrome copy of the rail's shape — track plus boundary dots — colored
 * by `className` through `currentColor`. The rail layers two of these, so the
 * base and its clipped accent can never drift apart.
 */
function RailShape({ geometry, className }: { geometry: RailGeometry; className: string }) {
  return (
    <g className={className}>
      <path d={geometry.path} strokeWidth={1} stroke="currentColor" />
      <circle cx={geometry.start.x} cy={geometry.start.y} r={DOT_RADIUS} fill="currentColor" />
      <circle cx={geometry.end.x} cy={geometry.end.y} r={DOT_RADIUS} fill="currentColor" />
    </g>
  );
}
