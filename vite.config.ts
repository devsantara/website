import { defineConfig, lazyPlugins } from 'vite-plus';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['pnpm-lock.yaml'],
    semi: true,
    singleQuote: true,
    jsxSingleQuote: false,
    trailingComma: 'all',
  },
  lint: {
    ignorePatterns: ['pnpm-lock.yaml'],
    env: { browser: true, node: true },
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
  },
  plugins: lazyPlugins(() => []),
});
export default config;
