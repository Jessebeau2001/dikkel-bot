import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-duplicate-imports': 'warn',
      'no-unassigned-vars': 'error',
      'no-useless-assignment': 'error',
      'camelcase': 'warn',
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'require-await': 'error',
      'semi': [ 'warn', 'always' ],
      'quotes': ['warn', 'single', { 'avoidEscape': true }]
    },
  }
);