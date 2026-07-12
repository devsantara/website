import mdx from '@mdx-js/rollup';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerRenderIndentGuides,
} from '@shikijs/transformers';
import rehypeMdxImportMedia from 'rehype-mdx-import-media';
import type { Options as RehypePrettyCodeOptions } from 'rehype-pretty-code';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import type { Plugin } from 'vite';

import { rehypeImage } from '#/modules/markdown/plugins/rehype-image';
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
  ],
};

/**
 * Vite plugin that compiles `.mdx` files through the project's remark/rehype
 * pipeline: frontmatter handling, GFM, the `:::tabs` directive
 * (`remarkTabs`), and Shiki syntax highlighting
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
        remarkDirective,
        remarkTabs,
      ],
      // `rehypeImage` runs before `rehypeMdxImportMedia` so it still sees the
      // raw string `src` it needs to read pixel dimensions from disk and to
      // detect a captioned image; import-media then turns every local `src`
      // into a fingerprinted asset import.
      rehypePlugins: [
        [rehypePrettyCode, rehypePrettyCodeOptions],
        rehypeImage,
        rehypeMdxImportMedia,
      ],
    }),
  };
}
