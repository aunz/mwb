module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  plugins: ['react'],
/*  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },*/
  globals: {
    __CLIENT__: true,
    __SERVER__: true,
    __DEV__: true,
    __CORDOVA__: true,
  },
  rules: {
    semi: [2, 'never'],
    'no-console': 0,
    'no-use-before-define': [2, 'nofunc'],
    camelcase: 0,
    'func-names': 0,
    'comma-dangle': 0,
    'max-len': 0,
    'prefer-template': 0,
    'prefer-arrow-callback': 0,
    'no-unused-expressions': 0,
    'dot-notation': 0,
    'arrow-parens': 0,
    'global-require': 0,
    'import/no-dynamic-require': 0,
  }
}
