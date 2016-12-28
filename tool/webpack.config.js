const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const shelljs = require('shelljs')

// const HtmlWebpackPlugin = require('html-webpack-plugin')

const postcss = [
  // require('postcss-import'), // use version 8.1.0, higher version causes problem in windows due to the use of JSPM
  require('postcss-calc'),
  require('postcss-nesting'),
  require('postcss-css-variables'),
  require('autoprefixer'),
]

const commonPlugins = [
  new webpack.NoErrorsPlugin(),
  new webpack.LoaderOptionsPlugin({
    options: { postcss }
  }),
]

const clientConfig = {
  entry: {
    client: ['./src/client/entry.js'],
  },
  output: {
    path: './build/public',
    publicPath: '/',
    // filename: 'client.js', //during development
    filename: '[name]_[chunkhash:7].js',
  },
  module: {
    rules: [...commonLoadersWithPresets()],
    // noParse: //,
  },
  // resolve: {
  //   alias: {},
  // },
  plugins: [
    ...commonPlugins,
    new AssetsPlugin({
      path: './build',
    }),
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
      __CORDOVA__: false,
    }),
    /* new HtmlWebpackPlugin({
      title: 'My Awesome App',
      template: './src/share/index.html',
      // filename: './src/share/index.html'
    }),*/
  ],
}

const serverConfig = {
  entry: {
    server: ['./src/server/entry.js'],
  },
  target: 'node',
  output: {
    path: './build/server',
    filename: 'server.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [...commonLoadersWithPresets({ target: 'server '})], 
  },
  plugins: [
    ...commonPlugins,
    new webpack.DefinePlugin({
      __CLIENT__: false,
      __SERVER__: true,
      __CORDOVA__: false,
    }),
  ],
  externals: [
    /^[@a-z][a-z\/\.\-0-9]*$/i, // native modules will be excluded, e.g require('react/server')
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
    publicPath: '/',
    filename: 'cordovaBundle.js',
  },
  module: {
    rules: [...commonLoadersWithPresets()],
    // noParse: [],
  },
  // resolve: {
  //   alias: {},
  // },
  plugins: [
    ...commonPlugins,
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
      __CORDOVA__: true,
    }),
    /* new HtmlWebpackPlugin({
      title: 'My Awesome App',
      template: './src/share/index.html',
      // filename: './src/share/index.html'
    }),*/
  ],
}

// copy static assets

shelljs.mkdir('-p', clientConfig.output.path)
shelljs.cp('-rf', './src/static/', clientConfig.output.path)

const argv = process.argv[2]
if (argv === 'all' || argv === 'cordovaOnly') {
  shelljs.mkdir('-p', cordovaConfig.output.path)
  shelljs.cp('-rf', './src/static/', cordovaConfig.output.path)
}

module.exports = { clientConfig, serverConfig, cordovaConfig }


function commonLoadersWithPresets({ target = 'client' } = {}) {
  return [{
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
          ['transform-runtime', { polyfill: target === 'client', useBuiltIns: true }] // helpers: true so babel still use _extends when doding spread { ... object }, polyfill: false, so babel don't polyfill Set, Map etc in server, but still polyfill in browsers
        ],
        cacheDirectory: true, // cache into OS temp folder by default
      }
    }],
  }, {
    test: /\.(?!(jsx?|json|s?css|less|html?)$)([^.]+$)/, // match everything except js, jsx, json, css, scss, less. You can add more
    use: [{
      loader: 'url-loader',
      query: {
        limit: 10000,
        name: '[name]_[hash:7].[ext]',
      }
    }],
  }]
}
