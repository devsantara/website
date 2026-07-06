import { type Locale } from '#/lib/i18n/paraglide/runtime';
import type { FileRoutesByTo } from '#/routeTree.gen';

import inlangConfig from '../../../project.inlang/settings.json' with { type: 'json' };

const availableLocales = inlangConfig.locales as Locale[];

type RoutePath = keyof FileRoutesByTo;

const excludedPaths = ['health', 'api', 'rpc'] as const;

type PublicRoutePath = Exclude<RoutePath, `${string}${(typeof excludedPaths)[number]}${string}`>;

type TranslatedPathname = {
  pattern: string;
  localized: Array<[Locale, string]>;
};

function toUrlPattern(path: string) {
  return (
    path
      // catch-all
      .replace(/\/\$$/, '/:path(.*)?')
      // optional parameters: {-$param}
      .replace(/\{-\$([a-zA-Z0-9_]+)\}/g, ':$1?')
      // named parameters: $param
      .replace(/\$([a-zA-Z0-9_]+)/g, ':$1')
      // remove trailing slash
      .replace(/\/+$/, '')
  );
}

export function createTranslatedPathnames(
  input: Record<PublicRoutePath, Record<Locale, string>>,
): TranslatedPathname[] {
  return Object.entries(input).map(([pattern, locales]) => ({
    pattern: toUrlPattern(pattern),
    localized: Object.entries(locales).map(
      ([locale, path]) =>
        [locale as Locale, `/${locale}${toUrlPattern(path)}`] satisfies [Locale, string],
    ),
  }));
}

export function createTranslatedPrerender(
  routes: Record<Locale, string[]>,
  options: { headers?: Record<string, string>; crawlLinks?: boolean } = {},
) {
  const prerenderRoutes = [];
  for (const locale of availableLocales) {
    for (const route of routes[locale]) {
      if (!route.startsWith('/')) {
        throw new Error(`[PRERENDER] Route must start with a leading slash: ${route}`);
      }
      prerenderRoutes.push({
        path: `/${locale}${route === '/' ? '' : route}`,
        prerender: { enabled: true, ...options },
      });
    }
  }
  return prerenderRoutes;
}
