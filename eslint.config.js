import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import accessibility from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, 'jsx-a11y': accessibility },
    rules: {
      ...accessibility.configs.recommended.rules,
      'jsx-a11y/label-has-associated-control': ['error', { depth: 4 }],
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['region'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-nested-ternary': 'error',
      'no-else-return': 'error',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'max-depth': ['error', 4],
      'max-statements-per-line': ['error', { max: 1 }],
      'max-lines': ['error', { max: 350, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 160, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['**/*.test.ts'], rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' } },
);
