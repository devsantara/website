import contentCollections from '@content-collections/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import rsc from '@vitejs/plugin-rsc';
import alchemy from 'alchemy/cloudflare/tanstack-start';
import { defineConfig, lazyPlugins } from 'vite-plus';

import { createLocalePrerenderPages, createLocaleUrlPatterns } from '#/lib/i18n/utils';
import { viteMdx } from '#/modules/markdown/markdown.vite';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // lucide-react ships a `"use client"` directive on its Icon module, so the RSC
  // graph treats it as a client boundary. Excluding it from the client dep
  // optimizer keeps that boundary consistent and silences the rsc:use-client
  // "inconsistently optimized" warning.
  optimizeDeps: { exclude: ['lucide-react'] },
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    target: 'esnext',
    rolldownOptions: {
      external: ['node:async_hooks', 'cloudflare:workers'],
    },
  },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['pnpm-lock.yaml', 'src/routeTree.gen.ts'],
    semi: true,
    singleQuote: true,
    jsxSingleQuote: false,
    trailingComma: 'all',
    sortImports: true,
    sortPackageJson: true,
    sortTailwindcss: true,
  },
  lint: {
    ignorePatterns: ['pnpm-lock.yaml', 'src/routeTree.gen.ts'],
    env: { browser: true, node: true },
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
  },
  plugins: lazyPlugins(() => [
    viteMdx(),
    // `environment: 'ssr'` builds the collection only in the SSR/RSC graph, so
    // the compiled MDX is never emitted into the client bundle.
    contentCollections({ environment: 'ssr' }),
    tanstackDevtools(),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
      start: { entry: 'entry.start.ts' },
      server: { entry: 'entry.server.ts' },
      client: { entry: 'entry.client.tsx' },
      prerender: { autoSubfolderIndex: false },
      pages: createLocalePrerenderPages(['/', '/posts', '/series']),
      // RSC lets us stream server-rendered MDX to the client without shipping
      // the compiled MDX (or mdx-bundler's `new Function`, blocked on Workers).
      rsc: { enabled: true },
      router: {
        entry: 'entry.router.ts',
        codeSplittingOptions: {
          defaultBehavior: [
            ['component', 'pendingComponent', 'errorComponent', 'notFoundComponent', 'loader'],
          ],
        },
      },
    }),
    rsc(),
    viteReact({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    babel({ presets: [reactCompilerPreset()] }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/i18n/paraglide',
      cookieName: 'LOCALE',
      outputStructure: 'message-modules',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      routeStrategies: [
        { match: '/health', exclude: true },
        { match: '/api/:path(.*)?', exclude: true },
        { match: '/rpc/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
        { match: '/assets/:path(.*)?', exclude: true },
      ],
      urlPatterns: createLocaleUrlPatterns(),
    }),
    // Cloudflare (via Alchemy) runs last so it can pick up the environments
    // configured by TanStack Start + RSC. `childEnvironments: ['rsc']` registers
    // the RSC graph as a child of the `ssr` Worker environment.
    alchemy({ viteEnvironment: { name: 'ssr', childEnvironments: ['rsc'] } }),
  ]),
});
export default config;
