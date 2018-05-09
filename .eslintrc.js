module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  plugins: ['react'],
  settings: {
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            alias: {
              '~': __dirname + '/src'
            }
          }
        }
      }
    }
  },
  env: {
    browser: true,
    node: true
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
    'global-require': 0,
    'no-underscore-dangle': 0,
    'arrow-body-style': 0,
    'react/jsx-filename-extension': 0,
    // 'react/forbid-prop-types': 0,
    'react/require-default-props': 0,
    'arrow-parens': 0,
    'import/no-extraneous-dependencies': 0,
    // 'import/first': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-path-concat': 0,
    'no-continue': 0,
    'no-restricted-syntax': 0,
    'no-bitwise': 0,
    'no-mixed-operators': 0,
    'import/first': 0,
    'no-param-reassign': 0,
    'no-nested-ternary': 0,
    'react/prefer-stateless-function': 0,
    'object-curly-newline': 0,
    'no-confusing-arrow': 0,
    'jsx-a11y/label-has-for': 0,
    'jsx-a11y/anchor-is-valid': [ 'error', {
      'components': ['Link'],
      'specialLink': ['to']
    }],
    'function-paren-newline': ['error', 'consistent'],
    'import/prefer-default-export': 0,
    'semi-style': 0,
    'react/no-unescaped-entities': 0,
    'react/no-multi-comp': 0,
  }
}
