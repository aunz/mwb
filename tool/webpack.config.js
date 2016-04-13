'use strict' // eslint-disable-line

// const path = require('path')
// const _root = path.resolve()

const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const postcss = () => [require('postcss-calc'), require('postcss-nesting'), require('autoprefixer')]

const commonLoaders = [{
  test: /\.jsx?$/,
  exclude: /(node_modules)/,
  loader: 'babel',
  query: {
    presets: ['react', 'es2015', 'stage-0'],
    plugins: ['transform-runtime'], //
    cacheDirectory: true, // cache into OS temp folder by default
  },
}, {
  test: /\.(png|jpg|jpeg|gif|mp3)$/,
  loader: 'url?limit=10000&name=[name]_[hash:6].[ext]',
}, {
  test: /\.txt$/,
  loader: 'raw',
}, {
  test: /\.json$/,
  loader: 'json',
}]

const commonPlugins = [
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.NoErrorsPlugin(),
]

const clientConfig = {
  entry: {
    client: ['./src/client/entry.js'],
  },
  output: {
    path: './build/public',
    // filename: 'clientBundle.js', //during development
    filename: 'clientBundle_[hash:6].js',
  },
  module: {
    loaders: [...commonLoaders],
    noParse: [],
  },
  resolve: {
    alias: {},
  },
  postcss,
  plugins: [...commonPlugins,
    new AssetsPlugin({
      path: './build',
    }),
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
    }),
    // new HtmlWebpackPlugin(),
  ],
}

const serverConfig = {
  entry: {
    server: ['./src/server/entry.js'],
  },
  target: 'node',
  output: {
    path: './build/server',
    filename: 'serverBundle.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [...commonLoaders],
  },
  postcss,
  plugins: [...commonPlugins,
    new webpack.DefinePlugin({
      __CLIENT__: false,
      __SERVER__: true,
    }),
  ],
  externals: [/^[@a-z][a-z\/\.\-0-9]*$/i, // native modules will be excluded, e.g require('react/server')
    /^.+assets\.json$/i, // these assets produced by assets-webpack-plugin
  ],
  node: {
    console: true,
    __filename: true,
    __dirname: true,
  },
}


/**
 * Cordova
 */

const cordovaConfig = {
  entry: {
    client: ['./src/client/entry.js'],
  },
  output: {
    path: './cordova/www/build',
    // filename: 'clientBundle.js', //during development
    filename: 'cordovaBundle.js',
  },
  module: {
    loaders: [...commonLoaders],
    noParse: [],
  },
  resolve: {
    alias: {},
  },
  postcss,
  plugins: [...commonPlugins,
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
      __CORDOVA__: true,
    }),
  ],
}

// copy static assets
require('shelljs').mkdir('-p', clientConfig.output.path)
require('shelljs').cp('-rf', './src/static/', clientConfig.output.path)

require('shelljs').mkdir('-p', cordovaConfig.output.path)
require('shelljs').cp('-rf', './src/static/', cordovaConfig.output.path)

module.exports = { clientConfig, serverConfig, cordovaConfig }
