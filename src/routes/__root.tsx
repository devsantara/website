import { TanStackDevtools } from '@tanstack/react-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

import { tanstackRouterDevtools } from '#/devtools/router-devtools';

import appStylesheet from '#/ui/styles/app.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '@devsantara/website' },
    ],
    links: [{ rel: 'stylesheet', href: appStylesheet }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools plugins={[tanstackRouterDevtools]} />
        <Scripts />
      </body>
    </html>
  );
}
