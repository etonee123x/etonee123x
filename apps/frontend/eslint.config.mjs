import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { importX } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import boundaries from 'eslint-plugin-boundaries';
import pluginQuery from '@tanstack/eslint-plugin-query';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.ts', '**/*.tsx', 'eslint.config.mjs'],
    extends: [
      pluginJs.configs.recommended,
      tseslint.configs.strictTypeChecked,
      sonarjs.configs.recommended,
      eslintPluginUnicorn.configs.recommended,
      eslintPluginPrettierRecommended,
      pluginQuery.configs['flat/recommended-strict'],
      importX.configs['flat/recommended'],
    ],

    plugins: {
      'import-x': importX,
      boundaries,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'widget', pattern: 'src/widgets/*/**', capture: ['slice'] },
        { type: 'feature', pattern: 'src/features/*/*/**', capture: ['family', 'slice'] },
        // FSD public API for cross-imports: `entities/<owner>/@x/<consumer>.ts`. Must come before the
        // generic `entity` descriptor below (more specific pattern wins as the primary type).
        { type: 'entity-x', pattern: 'src/entities/*/@x', capture: ['slice'] },
        { type: 'entity', pattern: 'src/entities/*/**', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
    },

    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-unexpected-multiline': 'error',
      'no-var': 'error',
      'no-unsafe-optional-chaining': 'error',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      'no-sparse-arrays': ['off'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'func-style': ['error', 'expression'],
      'no-return-assign': ['error', 'always'],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CatchClause > Identifier[typeAnnotation]:not([typeAnnotation.typeAnnotation.type="TSUnknownKeyword"])',
          message: 'catch-переменная должна быть только типа unknown',
        },
      ],
      'no-nested-ternary': 'error',
      'no-void': 'error',

      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
      ],
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic',
          readonly: 'generic',
        },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^$',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/no-invalid-void-type': 'off',

      'sonarjs/todo-tag': 'warn',

      'unicorn/prevent-abbreviations': [
        'error',
        { allowList: { props: true, Props: true, ref: true, Ref: true, env: true, Env: true } },
      ],
      'unicorn/no-null': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/no-object-as-default-parameter': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': 'off',

      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never',
        },
      ],

      'sonarjs/cognitive-complexity': ['off'],

      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],

      // FSD (Feature-Sliced Design) layer order: shared < entities < features < widgets < app.
      // `default: 'allow'` keeps external packages untouched; only same-layer/upward local imports are blocked.
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          // Imports between segments of the same feature are allowed; only cross-feature imports are restricted.
          policies: [
            {
              from: { element: { type: 'shared' } },
              disallow: { to: { element: { type: ['entity', 'feature', 'widget', 'app'] } } },
            },
            {
              from: { element: { type: 'entity' } },
              disallow: {
                to: {
                  element: { type: 'entity', captured: { slice: '!{{ from.element.captured.slice }}' } },
                },
              },
            },
            // FSD cross-imports: an entity may import another entity's `@x/<slice>.ts` public API only
            // when `<slice>.ts` matches its own slice, i.e. `entities/order/@x/product.ts` is importable
            // only from `entities/product`.
            {
              from: { element: { type: 'entity' } },
              disallow: {
                to: {
                  element: {
                    type: 'entity-x',
                    fileInternalPath: '!{{ from.element.captured.slice }}.ts',
                  },
                },
              },
            },
            {
              from: { element: { type: 'entity' } },
              disallow: { to: { element: { type: ['feature', 'widget', 'app'] } } },
            },
            {
              from: { element: { type: 'feature' } },
              disallow: {
                to: { element: { type: 'feature', captured: { family: '!{{ from.element.captured.family }}' } } },
              },
            },
            {
              from: { element: { type: 'feature' } },
              disallow: { to: { element: { type: ['widget', 'app'] } } },
            },
            {
              from: { element: { type: 'widget' } },
              disallow: {
                to: {
                  element: { type: 'widget', captured: { slice: '!{{ from.element.captured.slice }}' } },
                },
              },
            },
            {
              from: { element: { type: 'widget' } },
              disallow: { to: { element: { type: 'app' } } },
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/shared/ui/ds',
    'src/shared/api/openapi.ts',
  ]),
]);

export default eslintConfig;
