import type { MDXContent } from 'mdx/types';

import { mdxComponents } from '#/modules/markdown/components';

/**
 * Renders compiled MDX content with the app's component overrides applied.
 *
 * Takes an `MDXContent` component produced by the MDX compilation step (e.g.
 * `series.mdx`, `post.mdx`) and invokes it with {@link mdxComponents}, so that
 * markdown-generated tags and custom directives resolve to app-aware components.
 *
 * @param props.content - The compiled MDX component to render.
 */
export function MarkdownRender({ content: Content }: { content: MDXContent }) {
  return <Content components={mdxComponents} />;
}
