import type { ElementContent, Root } from 'hast';
import { raw } from 'hast-util-raw';
import { toHtml } from 'hast-util-to-html';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';

import type { Thumbnail } from '#/modules/thumbnail/thumbnail.schema';

/**
 * Parses a caption as inline Markdown that may also contain raw HTML, returning
 * hast children ready to drop into a `figcaption`. Both `[text](url)` and
 * `<a href>` render — the latter is what image credit tools (e.g. Unsplash)
 * hand you. Anchors flow on through the MDX component map, so caption links pick
 * up the app's `<Anchor>` behavior. This renders author-supplied HTML, but at
 * the same trust level MDX already grants post bodies, so it adds no exposure.
 *
 * Shared by the build-time image pass (`rehypeImage`) and the runtime
 * thumbnail caption resolver (`parseThumbnail`) so both parse identically.
 */
export function parseCaption(caption: string): ElementContent[] {
  // `mdast-util-to-hast` and `hast-util-raw` can each resolve their own copy of
  // @types/hast under pnpm's isolated store, so their `Nodes` types aren't
  // nominally identical even when structurally equal — passing `toHast`'s result
  // straight into `raw` errors under that resolution. Bridge the boundary
  // through the project's own `hast` types; the runtime values are ordinary
  // hast nodes, so only the compile-time identity is being reconciled.
  const hast = toHast(fromMarkdown(caption), { allowDangerousHtml: true });
  const tree = raw(hast as never) as unknown as Root;
  if (tree.type !== 'root') return [];

  // Inline Markdown comes back wrapped in a single paragraph; unwrap it so the
  // figcaption holds inline nodes rather than a nested block element.
  const [first] = tree.children;
  const nodes =
    tree.children.length === 1 && first?.type === 'element' && first.tagName === 'p'
      ? first.children
      : tree.children;
  return nodes.filter((node): node is ElementContent => node.type !== 'doctype');
}

/**
 * Parses an authored `Thumbnail` for a detail page: `src`/`alt` pass
 * through, and `caption` is rendered from inline Markdown to a static HTML
 * string — or dropped when the author gave no caption. Runs on the server, so
 * the Markdown parser never reaches the client bundle; the client only injects
 * the finished HTML (`ThumbnailFigure`). Returns `null` for a missing
 * thumbnail so callers can guard on the whole object.
 */
export function parseThumbnail(thumbnail: Thumbnail): Thumbnail {
  if (thumbnail == null) return null;
  // `parseCaption` returns hast typed against the project's `@types/hast`, while
  // `hast-util-to-html` resolves its own copy under pnpm's isolated store; the
  // runtime value is an ordinary hast root, so only compile-time identity is
  // being bridged here (same seam as `parseCaption` itself).
  const caption = thumbnail.caption?.trim()
    ? toHtml({ type: 'root', children: parseCaption(thumbnail.caption) } as never)
    : undefined;
  return { ...thumbnail, caption };
}
