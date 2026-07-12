import * as React from 'react';

/**
 * Renders markdown images (`img`) with content-page defaults.
 *
 * `loading="lazy"` and `decoding="async"` keep below-the-fold images off the
 * critical path. Local images arrive with intrinsic `width`/`height` from the
 * `rehypeImage` build pass (via `src` and dimension props spread here), so the
 * browser reserves space and the article doesn't reflow as they load; markdown
 * CSS pins `height:auto`/`max-width:100%` so those attributes never distort the
 * rendered size. `alt` defaults to `""` — a valid, decorative-image default —
 * when the author omits it.
 */
export function Image({ alt = '', ...props }: React.ComponentProps<'img'>) {
  return <img loading="lazy" decoding="async" alt={alt} {...props} />;
}
