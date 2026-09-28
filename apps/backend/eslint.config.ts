import { defineConfig } from 'eslint/config';

import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { importX } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default defineConfig([
  {
    ignores: ['dist/', 'node_modules/', 'src/types/openapi.ts'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      pluginJs.configs.recommended,
      tseslint.configs.strictTypeChecked,
      eslintPluginUnicorn.configs.recommended,
      eslintPluginPrettierRecommended,
      importX.configs['flat/recommended'],
    ],

    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        parser: '@typescript-eslint/parser',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importX,
      sonarjs,
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      // Keep generated OpenAPI types at the controller, domain, or entity boundary.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/types/openapi', '**/types/openapi'],
              message: 'Import OpenAPI types only from .controller, .domain, or .entity files.',
            },
          ],
        },
      ],
      'no-console': ['error'],
      'no-unexpected-multiline': 'error',
      'no-var': 'error',
      'no-unsafe-optional-chaining': 'error',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'always'],
      'no-sparse-arrays': ['error'],
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
      '@typescript-eslint/no-floating-promises': 'error',

      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],

      'sonarjs/todo-tag': 'warn',

      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
            props: true,
            Props: true,
            ref: true,
            Ref: true,
            env: true,
            Env: true,
            lib: true,
            Lib: true,
            src: true,
            Src: true,
          },
        },
      ],
      'unicorn/no-null': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/no-object-as-default-parameter': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': 'off',

      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    files: ['**/*.controller.ts', '**/*.domain.ts', '**/*.entity.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
