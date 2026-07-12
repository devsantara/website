import { Link } from '@tanstack/react-router';
import * as React from 'react';

/**
 * Whether `href` points inside this app and should use client-side routing.
 *
 * Absolute in-app paths (`/posts/...`) qualify; everything else — external
 * URLs, protocol-relative (`//host`), `mailto:`/`tel:`, and hash-only links —
 * does not, so the browser handles it natively.
 */
function isInternalLink(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Renders markdown links (`a`) with app-aware behavior: internal paths
 * ({@link isInternalLink}) navigate through TanStack Router's client-side
 * `Link`, while everything else falls back to a native anchor that opens in a
 * new, isolated tab.
 */
export function Anchor({ href = '', ...props }: React.ComponentProps<'a'>) {
  if (isInternalLink(href)) {
    return <Link to={href} {...props} />;
  }

  // External links open in a new tab; `rel` drops the `window.opener` reference
  // (noopener) and withholds the referrer (noreferrer) so the target page can't
  // reach back into this one.
  return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
}
