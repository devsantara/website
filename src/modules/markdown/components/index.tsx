import type { MDXComponents } from 'mdx/types';

import { Anchor } from '#/modules/markdown/components/anchor';
import { CodeBlock } from '#/modules/markdown/components/code-block';
import { Tabs } from '#/modules/markdown/components/tabs';

/**
 * Component overrides handed to the MDX runtime. Markdown-generated HTML tags
 * (`a`, `pre`) are swapped for app-aware components, and custom elements
 * (`Tabs`, emitted by the `:::tabs` directive) are exposed to MDX output.
 */
export const mdxComponents: MDXComponents = {
  a: Anchor,
  pre: CodeBlock,
  Tabs,
};
