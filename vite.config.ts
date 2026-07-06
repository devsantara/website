import { paraglideVitePlugin } from '@inlang/paraglide-js';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import alchemy from 'alchemy/cloudflare/tanstack-start';
import { defineConfig, lazyPlugins } from 'vite-plus';

import { translatedPathnames, translatedPrerender } from '#/lib/i18n/config';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    target: 'esnext',
    rollupOptions: {
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
    tanstackDevtools(),
    alchemy(),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
      start: { entry: 'entry.start.ts' },
      server: { entry: 'entry.server.ts' },
      client: { entry: 'entry.client.tsx' },
      pages: translatedPrerender,
      router: {
        entry: 'entry.router.ts',
        codeSplittingOptions: {
          defaultBehavior: [
            ['component', 'pendingComponent', 'errorComponent', 'notFoundComponent', 'loader'],
          ],
        },
      },
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/i18n/paraglide',
      cookieName: 'LOCALE',
      outputStructure: 'message-modules',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      // DisableAsyncLocalStorage should ONLY be used in serverless environments like Cloudflare Workers.
      disableAsyncLocalStorage: true,
      routeStrategies: [
        { match: '/health', exclude: true },
        { match: '/api/:path(.*)?', exclude: true },
        { match: '/rpc/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
        { match: '/assets/:path(.*)?', exclude: true },
      ],
      urlPatterns: translatedPathnames,
    }),
  ]),
});
export default config;
