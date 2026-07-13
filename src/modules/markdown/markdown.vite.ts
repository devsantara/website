import mdx from '@mdx-js/rollup';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerRenderIndentGuides,
} from '@shikijs/transformers';
import rehypeAutolinkHeadings, {
  type Options as RehypeAutolinkHeadingsOptions,
} from 'rehype-autolink-headings';
import rehypeMdxImportMedia from 'rehype-mdx-import-media';
import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import type { Plugin } from 'vite';

import { rehypeImage } from '#/modules/markdown/plugins/rehype-image';
import { remarkAlert } from '#/modules/markdown/plugins/remark-alert';
import { remarkTabs } from '#/modules/markdown/plugins/remark-tabs';

/**
 * rehype-pretty-code configuration for compile-time syntax highlighting.
 *
 * Highlighting happens entirely at MDX compile time: the Worker and the
 * browser only ever see the finished HTML. Fence meta owns block-level config
 * (title="...", {1,3}, /word/, showLineNumbers) via rehype-pretty-code;
 * `[!code ...]` comments own per-line semantics (diff/focus/error/warning) via
 * the Shiki transformers. Dual themes are emitted as CSS variables and toggled
 * by the `.dark` class in app.css.
 */
const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: 'github-light-default',
    dark: 'github-dark-default',
  },
  keepBackground: false,
  // Block-scoped on purpose: a bare string would also apply to inline code,
  // pulling every unmarked `code span` through Shiki — where the notation
  // transformers strip `[!code ...]` mentions out of prose.
  defaultLang: { block: 'plaintext' },
  transformers: [
    transformerNotationDiff(),
    transformerNotationFocus(),
    transformerNotationErrorLevel(),
    transformerRenderIndentGuides(),
    transformerColorizedBrackets(),
  ],
};

/**
 * rehype-autolink-headings configuration. `rehypeSlug` stamps a stable `id` on
 * every heading (derived from its text); this then appends a hover-revealed `#`
 * permalink inside each heading that deep-links to that `id`. The generated
 * `<a href="#id">` renders through the `Anchor` override, which routes hash
 * links to a plain same-page anchor (not a new tab). `markdown.css` owns the
 * reveal-on-hover styling and the `scroll-margin-top` landing offset.
 */
const rehypeAutolinkHeadingsOptions: RehypeAutolinkHeadingsOptions = {
  behavior: 'append',
  properties: { className: ['heading-anchor'], ariaLabel: 'Permalink to this heading' },
  content: { type: 'text', value: '#' },
};

/**
 * Vite plugin that compiles `.mdx` files through the project's remark/rehype
 * pipeline: frontmatter handling, GFM, GitHub-style alerts (`remarkAlert`), the
 * `:::tabs` directive (`remarkTabs`), and Shiki syntax highlighting
 * (`rehypePrettyCodeOptions`).
 */
export function viteMdx(): Plugin {
  return {
    // MDX must run before the React plugin, hence `enforce: 'pre'`. The remark
    // plugins strip the YAML frontmatter so it never leaks into the rendered
    // output (Content Collections parses it separately, `frontmatter-only`).
    enforce: 'pre',
    ...mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        // `remarkAlert` reads the blockquotes GFM produced; it must run after
        // `remarkGfm` and is independent of the `:::` directive passes below.
        remarkAlert,
        remarkDirective,
        remarkTabs,
      ],
      // `rehypeImage` runs before `rehypeMdxImportMedia` so it still sees the
      // raw string `src` it needs to read pixel dimensions from disk and to
      // detect a captioned image; import-media then turns every local `src`
      // into a fingerprinted asset import.
      rehypePlugins: [
        [rehypePrettyCode, rehypePrettyCodeOptions],
        // `rehypeSlug` must run before `rehypeAutolinkHeadings`, which links to
        // the `id` it stamps. Both only touch headings, so their position
        // relative to the code/image passes is immaterial.
        rehypeSlug,
        [rehypeAutolinkHeadings, rehypeAutolinkHeadingsOptions],
        rehypeImage,
        rehypeMdxImportMedia,
      ],
    }),
  };
}
