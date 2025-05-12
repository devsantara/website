import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import eslintJs from '@eslint/js';
import { defineConfig } from 'eslint/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

const nextJsReservedFiles = [
  'default',
  'error',
  'global-error',
  'forbidden',
  'instrumentation',
  'layout',
  'loading',
  'mdx-components',
  'middleware',
  'not-found',
  'page',
  'route',
  'template',
  'unauthorized',
];

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslintJs.configs.recommended,
});

const eslintConfig = defineConfig([
  includeIgnoreFile(gitignorePath),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
  },
  ...compat.config({
    extends: ['eslint:recommended', 'next/core-web-vitals', 'next/typescript'],
  }),
  {
    name: 'Javascript rules',
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
      'no-debugger': ['error'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-tabs': ['error', { allowIndentationTabs: false }],
      indent: ['error', 2],
      'jsx-quotes': ['error', 'prefer-double'],
      'linebreak-style': ['error', 'unix'],
      eqeqeq: ['error', 'always'],
      'no-undef': 'error',
      'prefer-const': [
        'error',
        { destructuring: 'all', ignoreReadBeforeAssign: false },
      ],
    },
  },
  {
    name: 'Import rules',
    rules: {
      'import/first': ['error'],
      'import/newline-after-import': ['error', { count: 1 }],
      'import/no-absolute-path': ['error'],
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/no-cycle': ['error'],
      'import/no-self-import': ['error'],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'unknown',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          named: true,
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    name: 'Source code export rules',
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    // only allow named export in source code
    rules: {
      'import/no-default-export': ['error'],
    },
  },
  {
    name: 'NextJS reserved files export rules',
    files: [
      ...nextJsReservedFiles.map((keyword) => {
        return `src/app/**/${keyword}.{js,jsx,ts,tsx}`;
      }),
      'src/middleware.{js,ts}',
    ],
    // only allow default export in reserved files
    rules: {
      'import/no-default-export': ['off'],
      'import/prefer-default-export': ['error'],
    },
  },
  {
    name: 'Typescript rules',
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'all', argsIgnorePattern: '_', caughtErrorsIgnorePattern: '_' },
      ],
      '@typescript-eslint/no-empty-interface': [
        'error',
        { allowSingleExtends: true },
      ],
    },
  },
  {
    name: 'Typescript definition files rules',
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': ['off'],
      'import/no-default-export': ['off'],
      'import/prefer-default-export': ['error'],
    },
  },
  {
    name: 'React rules',
    rules: {
      'react/jsx-boolean-value': ['error', 'never'],
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'react/jsx-curly-spacing': ['error', 'never', { allowMultiline: true }],
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration' },
      ],
      /**
       * Avoid hardcoded labels
       * @see {@link https://next-intl.dev/docs/workflows/linting#avoid-hardcoded-labels-in-component-markup}
       */
      'react/jsx-no-literals': ['error'],
      'react/jsx-no-leaked-render': ['error'],
      'react/jsx-no-duplicate-props': ['error'],
      'react/no-object-type-as-default-prop': ['error'],
      'react/jsx-no-target-blank': [
        'error',
        {
          allowReferrer: false,
          enforceDynamicLinks: 'always',
          warnOnSpreadAttributes: true,
        },
      ],
      'react/jsx-handler-names': [
        'error',
        {
          eventHandlerPrefix: 'handle',
          eventHandlerPropPrefix: 'on',
        },
      ],
    },
  },
  {
    name: 'Restricted syntax rules',
    rules: {
      'no-restricted-syntax': [
        'error',
        // React restricted import
        {
          message:
            "Do not import default from React. Use a namespace `import * as React from 'react'` instead.",
          selector:
            'ImportDeclaration[source.value="react"] ImportDefaultSpecifier',
        },
        {
          message:
            "Please import React using `import * as React from 'react'` instead of named imports.",
          selector: "ImportDeclaration[source.value='react'] ImportSpecifier",
        },
        {
          message:
            "Please import React using namespace `React` (case sensitive) `import * as React from 'react'` instead of others.",
          selector:
            "ImportDeclaration[source.value='react'] ImportNamespaceSpecifier:not([local.name='React'])",
        },
      ],
    },
  },
]);

export default eslintConfig;
