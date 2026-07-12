import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Element, Root } from 'hast';
import { imageSize } from 'image-size';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

import { parseCaption } from '#/modules/thumbnail/thumbnail.utils';

/**
 * Matches sources `rehype-mdx-import-media` leaves untouched: `http:`/`https:`,
 * protocol-relative (`//host`), and root-absolute (`/logo.png`, a `public/`
 * asset). We can't measure any of these at build time, so they render without
 * intrinsic dimensions — the accepted trade-off for the pass-through case.
 */
const REMOTE = /^(https?:)?\//;
/** `data:`, `mailto:`, and any other URI scheme — also unmeasurable on disk. */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Whether `src` points at a colocated file we can read relative to the MDX. */
function isLocal(src: string): boolean {
  return !REMOTE.test(src) && !SCHEME.test(src);
}

/** The whitespace-only text nodes MDX leaves around an image in a paragraph. */
function isBlank(node: { type: string; value?: string }): boolean {
  return node.type === 'text' && (node.value ?? '').trim() === '';
}

/**
 * Build-time rehype pass for local images, run *before*
 * `rehype-mdx-import-media` rewrites `src` into an import — so it still sees the
 * raw string path. It does two things:
 *
 * 1. **Intrinsic dimensions.** For every colocated image (`isLocal`) it
 *    reads the file's real pixel size and stamps `width`/`height` on the node.
 *    The browser then reserves space before the bytes arrive, eliminating the
 *    layout shift a content page would otherwise suffer. Remote/absolute srcs
 *    and unreadable/unsupported files (e.g. a viewBox-only SVG) are skipped —
 *    dimensions are best-effort; resolving the import is import-media's job.
 * 2. **Captions.** A paragraph whose only content is a titled image
 *    (`![alt](./x.png "caption")`) becomes `<figure><img><figcaption>…`, the
 *    caption parsed as Markdown/HTML (`parseCaption`). The `<p>` unwrap is
 *    mandatory: `<figure>` is not valid inside `<p>`. An image without a title,
 *    or one sharing its paragraph with other content (e.g. wrapped in a link),
 *    stays inline.
 */
export function rehypeImage() {
  return (tree: Root, file: VFile) => {
    // Pass 1: stamp intrinsic dimensions onto every measurable image. Done
    // first so the node already carries width/height when pass 2 moves it into
    // a figure.
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = node.properties.src;
      if (typeof src !== 'string' || !isLocal(src)) return;
      if (file.dirname == null) return;

      try {
        const buffer = readFileSync(path.resolve(file.dirname, src));
        const { width, height } = imageSize(buffer);
        if (width && height) {
          node.properties.width = width;
          node.properties.height = height;
        }
      } catch {
        // Unreadable or unsupported: leave dimensions off. If the file is
        // genuinely missing, import-media raises the canonical resolve error.
      }
    });

    // Pass 2: promote `<p>` wrappers around a single titled image into a figure
    // with a caption.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || parent == null || index == null) return;

      const content = node.children.filter((child) => !isBlank(child));
      const [only] = content;
      if (content.length !== 1 || only.type !== 'element' || only.tagName !== 'img') return;

      const img = only;
      const title = img.properties.title;
      if (typeof title !== 'string' || title.trim() === '') return;

      // Move the caption out of the tooltip and into the figcaption so it isn't
      // announced twice.
      delete img.properties.title;
      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { dataImageFigure: '' },
        children: [
          img,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: parseCaption(title),
          },
        ],
      };
      parent.children[index] = figure;
      // Dimensions are already set and the figure needs no further visiting.
      return SKIP;
    });
  };
}
