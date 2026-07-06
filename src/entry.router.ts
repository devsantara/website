import { createRouter } from '@tanstack/react-router';

import { deLocalizeUrl, localizeUrl } from '#/lib/i18n/paraglide/runtime';
import { routeTree } from '#/routeTree.gen';

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    trailingSlash: 'never',
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  });

  return router;
}
