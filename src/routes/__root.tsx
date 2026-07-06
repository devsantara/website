import { TanStackDevtools } from '@tanstack/react-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

import { tanstackRouterDevtools } from '#/devtools/router-devtools';
import { Toaster } from '#/ui/components/core/sonner';
import { TooltipProvider } from '#/ui/components/core/tooltip';
import { ThemeProvider } from '#/ui/theme';

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
    <html suppressHydrationWarning lang="en" dir="ltr" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <TanStackDevtools plugins={[tanstackRouterDevtools]} />
        <Scripts />
      </body>
    </html>
  );
}
