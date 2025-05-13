/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  '*.{ts,tsx}': (stagedFiles) => [
    `eslint ${stagedFiles.join(' ')}`,
    `prettier --write ${stagedFiles.join(' ')}`,
  ],
  '*.{md,json,css,sh,yaml,yml}': (stagedFiles) => [
    `prettier --write ${stagedFiles.join(' ')}`,
  ],
};

export default lintStagedConfig;
