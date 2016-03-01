module.exports = {
  extends: 'airbnb',
  plugins: ['react'],
  parserOptions: {
    ecmaVersion: 6
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
  }
}