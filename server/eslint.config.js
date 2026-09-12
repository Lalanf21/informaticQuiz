// @ts-check
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'data/**', 'eslint.config.js'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Kode server memakai `any` untuk payload JSON polymorphic — izinkan dengan peringatan.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  // Harus terakhir: matikan rule stylistic yang bentrok dengan Prettier.
  prettierConfig,
);
