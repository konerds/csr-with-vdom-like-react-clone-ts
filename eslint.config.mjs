import configPrettier from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import eslintTS from 'typescript-eslint';

const CONFIGS_COMMON = {
  files: ['**/*.{ts,tsx,js,mjs}'],
  languageOptions: {
    ecmaVersion: 'latest',
    globals: { ...globals.node, ...globals.es2022, ...globals.browser },
    sourceType: 'module',
  },
};

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  ...eslintTS.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: eslintTS.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.json'] },
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
  },
  {
    ...CONFIGS_COMMON,
    plugins: {
      import: pluginImport,
      perfectionist: pluginPerfectionist,
      prettier: pluginPrettier,
      'simple-import-sort': pluginSimpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/exports-last': 'error',
      'import/newline-after-import': ['error', { count: 1 }],
      'no-console': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 1, maxEOF: 1 }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          next: ['if', 'for', 'while', 'do', 'switch', 'try'],
          prev: ['*'],
        },
        {
          blankLine: 'always',
          next: ['*'],
          prev: [
            'if',
            'for',
            'while',
            'do',
            'switch',
            'try',
            'break',
            'continue',
          ],
        },
        { blankLine: 'always', next: ['function', 'class'], prev: '*' },
        { blankLine: 'always', next: '*', prev: ['function', 'class'] },
        { blankLine: 'always', next: 'return', prev: '*' },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          ignoreCase: true,
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          destructuredObjects: true,
          ignoreCase: true,
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'off',
      'sort-imports': 'off',
    },
  },
  configPrettier,
  {
    ...CONFIGS_COMMON,
    rules: {
      curly: ['error', 'all'],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            ['type-builtin', 'value-builtin'],
            ['type-external', 'value-external'],
            [
              'type-internal',
              'type-tsconfig-path',
              'value-internal',
              'value-tsconfig-path',
            ],
            ['type-parent', 'value-parent'],
            ['type-sibling', 'value-sibling'],
            ['type-index', 'value-index'],
            'unknown',
          ],
          internalPattern: ['^@.+'],
          newlinesBetween: 1,
          order: 'asc',
          tsconfig: { rootDir: '.' },
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-named-exports': [
        'error',
        { ignoreCase: true, order: 'asc', type: 'alphabetical' },
      ],
    },
  },
];
