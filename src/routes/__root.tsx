import geistMonoFont from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url';
import geistSansFont from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { preload } from 'react-dom';

import { tanstackRouterDevtools } from '#/devtools/router-devtools';
import { getLocale, getTextDirection } from '#/lib/i18n/paraglide/runtime';
import { Toaster } from '#/ui/components/core/sonner';
import { TooltipProvider } from '#/ui/components/core/tooltip';
import { ThemeProvider } from '#/ui/theme';

import appStylesheet from '#/ui/styles/app.css?url';
import fontsStylesheet from '#/ui/styles/fonts.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '@devsantara/website' },
    ],
    links: [
      { rel: 'stylesheet', href: fontsStylesheet },
      { rel: 'stylesheet', href: appStylesheet },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const textDirection = getTextDirection();

  preload(geistSansFont, { as: 'font', type: 'font/woff2' });
  preload(geistMonoFont, { as: 'font', type: 'font/woff2' });

  return (
    <html suppressHydrationWarning lang={locale} dir={textDirection} className="antialiased">
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
