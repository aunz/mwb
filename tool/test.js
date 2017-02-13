const path = require('path')
const child_process = require('child_process')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { clientConfig, serverConfig, } = require('./webpack.config.test')

const commonLoaders = [{
  test: /\.css$/,
  use: [{
    loader: ExtractTextPlugin.extract({ loader: ['css-loader', 'postcss-loader'] })
  }]
}]

const commonPlugins = [
  new webpack.DefinePlugin({
    'process.env.TEST': true,
    'process.env.NODE_ENV': '"development"',
  }),
  new ExtractTextPlugin({ filename: 'styles.css', allChunks: false })
]

/**
 * Client
 */

// clientConfig.module.rules.push(...)
// clientConfig.plugins.push(...)

compileAndTest(clientConfig, 'CLIENT')

/**
 * Server
 */

// serverConfig.module.rules.push(...)
// serverConfig.plugins.push(...)

compileAndTest(serverConfig, 'SERVER')


/**
 * @arg {Object} config
 * @arg {string} arch - 'CLIENT' | 'SERVER'
 */

function compileAndTest(config, arch) {
  config.devtool = 'cheap-module-eval-source-map' // eslint-disable-line no-param-reassign
  config.module.rules.push(...commonLoaders)
  config.plugins.push(...commonPlugins)

  let child
  webpack(config).watch({}, (err, stats) => {
    if (stats.hasErrors()) {
      console.log(arch + '\n', stats.toString({ colors: true }))
      return
    }
    if (child) child.kill()
    child = child_process.fork(path.join(config.output.path, config.output.filename))
  })
}
