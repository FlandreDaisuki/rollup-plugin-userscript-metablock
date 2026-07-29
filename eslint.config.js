import flandre from '@flandredaisuki/eslint-config';

/** @satisfies {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'examples/**/out.user.js',
      'test/options/file/invalid/**',
    ],
  },
  ...flandre.preset,
  {
    files: [
      'examples/**/*.js',
      'test/bundle/main.js',
    ],
    rules: {
      'no-console': 'off',
    },
  },
];
