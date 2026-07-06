import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, lazyPlugins } from 'vite-plus';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  preview: { port: 3000 },
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
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
      start: { entry: 'entry.start.ts' },
      server: { entry: 'entry.server.ts' },
      client: { entry: 'entry.client.tsx' },
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
  ]),
});
export default config;
