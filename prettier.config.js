/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const prettierConfig = {
  arrowParens: 'always',
  bracketSameLine: false,
  endOfLine: 'lf',
  bracketSpacing: true,
  jsxSingleQuote: false,
  printWidth: 80,
  objectWrap: 'preserve',
  semi: true,
  singleAttributePerLine: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  plugins: [],
};

export default prettierConfig;
