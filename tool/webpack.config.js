const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const shelljs = require('shelljs')

// import HtmlWebpackPlugin from 'html-webpack-plugin'
const postcss = [
  require('postcss-calc'), // eslint-disable-line
  require('postcss-nesting'), // eslint-disable-line global-require
  require('postcss-css-variables'), // eslint-disable-line global-require
  require('autoprefixer'), // eslint-disable-line global-require
]

const commonPlugins = [
  new webpack.optimize.OccurrenceOrderPlugin(),
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
    // filename: 'clientBundle.js', //during development
    filename: 'clientBundle_[hash:6].js',
  },
  module: {
    loaders: [...commonLoadersWithPresets(['latest', 'stage-0', 'react'])],
    noParse: [],
  },
  resolve: {
    alias: {},
  },
  plugins: [...commonPlugins,
    new AssetsPlugin({
      path: './build',
    }),
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
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
    filename: 'serverBundle.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [...commonLoadersWithPresets(['latest', 'stage-0', 'react'])], // can use node5 instead of es2015 when uglify-js can handle es6
  },
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
    publicPath: '/',
    filename: 'cordovaBundle.js',
  },
  module: {
    loaders: [...commonLoadersWithPresets(['latest', 'stage-0', 'react'])],
    noParse: [],
  },
  resolve: {
    alias: {},
  },
  plugins: [...commonPlugins,
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


function commonLoadersWithPresets(presets) {
  return [{
    test: /\.jsx?$/,
    exclude: /(node_modules)/,
    loader: 'babel',
    query: {
      presets,
      plugins: ['transform-runtime'], //
      cacheDirectory: true, // cache into OS temp folder by default
    }
  }, {
    test: /\.json$/,
    loader: 'json',
  }, {
    test: /\.(?!(jsx?|json|s?css|less|html?)$)([^.]+$)/, // match everything except js, jsx, json, css, scss, less. You can add more
    loader: 'url?limit=10000&name=[name]_[hash:6].[ext]',
  }]
}
