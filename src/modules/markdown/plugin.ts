import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import type { Plugin } from 'vite';

export function viteMdx(): Plugin {
  return {
    // MDX must run before the React plugin, hence `enforce: 'pre'`. The remark
    // plugins strip the YAML frontmatter so it never leaks into the rendered
    // output (Content Collections parses it separately, `frontmatter-only`).
    enforce: 'pre',
    ...mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
    }),
  };
}
