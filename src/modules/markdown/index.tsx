import type { MDXContent } from 'mdx/types';

import { mdxComponents } from '#/modules/markdown/components';

export function MarkdownRender({ content: Content }: { content: MDXContent }) {
  return <Content components={mdxComponents} />;
}
