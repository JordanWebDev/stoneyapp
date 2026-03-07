module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended-typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jsdoc'],
  rules: {
    // Require JSDoc comments on exported functions/classes to enforce universal documentation skill
    'jsdoc/require-jsdoc': [
      'warn',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true
        },
        contexts: [
          'ExportNamedDeclaration',
          'ExportDefaultDeclaration'
        ]
      }
    ],
    // Ensure descriptions are provided in JSDoc
    'jsdoc/require-description': 'warn',
    // Relax some strict JS doc rules that might be overly annoying for TS apps
    'jsdoc/require-param-type': 'off', // TypeScript handles the types
    'jsdoc/require-returns-type': 'off', // TypeScript handles return types

    // Standard TS rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  env: {
    node: true,
    browser: true,
    'react-native/react-native': true
  }
};
