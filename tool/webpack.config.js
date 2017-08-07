const path = require('path')
const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const commonPlugins = []

const resolve = {
  alias: {
    '~': path.resolve('./src') // use ~ to refer to the src folder. e.g. if you are in myApp/src/client/utils/fruit.js, you want to import banana which is in myApp/src/share/banana.js, you can write import banana from '~/share/banana' (this is better than using a relative path: import banana from '../../share/banana')
  }
}

const clientConfig = {
  entry: {
    client: ['./src/client/entry.js'],
  },
  output: {
    path: path.resolve('./build/public'),
    publicPath: '/',
    // filename: 'client.js', //during development
    filename: '[name]_[chunkhash:7].js',
  },
  module: {
    rules: [...commonLoadersWithPresets()],
    // noParse: //,
  },
  resolve,
  plugins: [
    ...commonPlugins,
    new AssetsPlugin({
      path: './build',
    }),
    new webpack.DefinePlugin({
      'process.env.APP_ENV': '"web"',
      'process.env.CORDOVA': false,
    }),
    new HtmlWebpackPlugin({
      // title: 'My Awesome App',
      template: './src/share/index.html',
      // filename: './src/share/index.html'
    }),
  ],
}

const serverConfig = {
  entry: {
    server: ['./src/server/entry.js'],
  },
  target: 'node',
  output: {
    path: path.resolve('./build/server'),
    filename: 'server.js',
    libraryTarget: 'commonjs2', // src: const express = require('express') -> webpack builds: const express = require('express'); otherwise webpack builds: const express = express, which is wrong
  },
  module: {
    rules: [...commonLoadersWithPresets({ target: 'server' })],
  },
  resolve,
  plugins: [
    ...commonPlugins,
    new webpack.DefinePlugin({
      'process.env.APP_ENV': '"node"',
      'process.env.CORDOVA': false,
    }),
  ],
  externals: [
    /^[@a-z][a-z/\.\-0-9]*$/i, // native modules will be excluded, e.g require('react/server')
    /^.+assets\.json$/i, // these assets produced by assets-webpack-plugin
  ]
}


/**
 * Cordova
 */

const cordovaConfig = {
  entry: {
    cordovaClient: ['./src/client/entry.js'],
  },
  output: {
    path: path.resolve('./cordova/www/build'),
    publicPath: '/',
    filename: '[name].js',
  },
  module: {
    rules: [...commonLoadersWithPresets()],
    // noParse: [],
  },
  resolve,
  plugins: [
    ...commonPlugins,
    new webpack.DefinePlugin({
      'process.env.APP_ENV': '"web"',
      'process.env.CORDOVA': true,
    }),
    new HtmlWebpackPlugin({
      // title: 'My Awesome App',
      template: './src/share/index.html',
      // filename: './src/share/index.html'
    }),
  ]
}

function copy() {
  const { exec } = require('child_process')
  exec('mkdir ' + clientConfig.output.path + ' && cp -rf ./src/public/. ' + clientConfig.output.path)
  const argv = process.argv[2]
  if (argv === 'all' || argv === 'cordovaOnly') {
    exec('mkdir ' + cordovaConfig.output.path + ' && cp -rf ./src/public/. ' + cordovaConfig.output.path)
  }
}

module.exports = { clientConfig, serverConfig, cordovaConfig, copy }


function commonLoadersWithPresets({ target = 'client' } = {}) {
  const loader = [{
    test: /\.jsx?$/,
    exclude: /(node_modules)/,
    use: [{
      loader: 'babel-loader',
      query: {
        presets: [
          ['env', {
            target: target === 'client'
              ? { browsers: ['last 2 versions', '> 5%'] }
              : { node: true },
            modules: false,
            useBuiltIns: true,
          }],
          'stage-0',
          'react'
        ],
        plugins: [
          ['transform-runtime', { polyfill: false }] // helpers: true (default) so babel use modulised helpers when doding spread { ... object }, polyfill: false, so babel don't polyfill Set, Map, etc in server. 
        ],
        cacheDirectory: true, // cache into OS temp folder by default
      }
    }],
  }, {
    test: /\.sql$/,
    // exclude: /(node_modules)/,
    use: ['raw-loader'],
  }, {
    test: /\.(?!(jsx?|json|s?css|less|html?|sql)$)([^.]+$)/, // match everything except js, jsx, json, css, scss, less. You can add more
    // exclude: /(node_modules)/,
    use: [{
      loader: 'url-loader',
      query: {
        limit: 10000,
        name: '[name]_[hash:7].[ext]',
        emitFile: target === 'client',
      }
    }],
  }]
  if (target !== 'client') {
    loader.push({
      test: /^((?!\.module).)*css$/i,
      use: [{ loader: 'null-loader' }]
    })
  }

  return loader
}
