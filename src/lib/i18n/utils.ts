import { type Locale } from '#/lib/i18n/paraglide/runtime';

import inlangConfig from '../../../project.inlang/settings.json' with { type: 'json' };

const availableLocales = inlangConfig.locales as Locale[];

// Locale-prefixed URL patterns for Paraglide route matching. Each base pattern
// maps to `[locale, localizedPath]` tuples, e.g. `/` -> `/en`, `/id`.
export function createLocaleUrlPatterns(): {
  pattern: string;
  localized: [string, string][];
}[] {
  const basePatterns = ['/', '/:path(.*)?'];
  return basePatterns.map((pattern) => ({
    pattern,
    localized: availableLocales.map(
      (locale) => [locale, `/${locale}${pattern === '/' ? '' : pattern}`] as const,
    ),
  }));
}

// Expands each route into a locale-prefixed prerender entry, e.g.
// `/posts` -> `/en/posts`, `/id/posts`.
export function createLocalePrerenderPages(
  routes: string[],
  options: { headers?: Record<string, string>; crawlLinks?: boolean } = {},
) {
  return routes.flatMap((route) => {
    if (!route.startsWith('/')) {
      throw new Error(`[PRERENDER] Route must start with a leading slash: ${route}`);
    }
    return availableLocales.map((locale) => ({
      path: `/${locale}${route === '/' ? '' : route}`,
      prerender: { enabled: true, ...options },
    }));
  });
}
