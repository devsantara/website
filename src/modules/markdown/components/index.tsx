import type { MDXComponents } from 'mdx/types';

import { Anchor } from '#/modules/markdown/components/anchor';
import { Callout } from '#/modules/markdown/components/callout';
import { CodeBlock } from '#/modules/markdown/components/code-block';
import { Image } from '#/modules/markdown/components/image';
import { Table } from '#/modules/markdown/components/table';
import { Tabs } from '#/modules/markdown/components/tabs';

/**
 * Component overrides handed to the MDX runtime. Markdown-generated HTML tags
 * (`a`, `pre`, `img`, `table`) are swapped for app-aware components, and custom
 * elements (`Tabs` from the `:::tabs` directive, `Callout` from GitHub-style
 * `> [!NOTE]` alerts) are exposed to MDX output.
 */
export const mdxComponents: MDXComponents = {
  a: Anchor,
  pre: CodeBlock,
  img: Image,
  table: Table,
  Tabs,
  Callout,
};
