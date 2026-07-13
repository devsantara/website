import * as React from 'react';

import { CodeCopyButton } from '#/modules/markdown/components/code-copy-button';

/**
 * Renders a fenced code block (`pre`) with a {@link CodeCopyButton}.
 *
 * rehype-pretty-code wraps every fence in a `figure[data-rehype-pretty-code-figure]`
 * (plus a `figcaption` when the fence has a title). Rendering the copy button
 * as a sibling of `pre` puts it inside that figure, which app.css makes the
 * positioning context — so the same button lands in the header bar of titled
 * blocks and floats over the code of untitled ones.
 */
export function CodeBlock(props: React.ComponentProps<'pre'>) {
  return (
    <>
      <pre {...props} />
      <CodeCopyButton />
    </>
  );
}
