module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/extensions': ['error', 'ignorePackages'],
    'class-methods-use-this': 'off',
    'no-param-reassign': ['error', { props: false }],
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'import/prefer-default-export': 'off'
  },
  globals: {
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly'
  }
};