const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { ExtractTextLoader, injectWHM } = require('./common')

const { copy } = require('./webpack.config')
const { clientConfig, serverConfig } = require('./webpack.config.test')
const clientConfigNode = require('lodash/cloneDeep')(serverConfig)

const { alterClient, alterServer, alterCordova } = (function () {
  try {
    return require('../mwb.config.js') // eslint-disable-line no-unresolved
  } catch (e) {
    return {}
  }
}())

const commonPlugins = [
  new webpack.DefinePlugin({
    'process.env.TEST': true,
    'process.env.NODE_ENV': '"development"',
  }),
  new ExtractTextPlugin({ filename: 'styles.css', allChunks: false }), // has to use this for universal server client rendering
]


// Client run in browser
clientConfig.devtool = 'cheap-module-eval-source-map' // eslint-disable-line no-param-reassign
clientConfig.module.rules.push(...ExtractTextLoader)
clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
clientConfig.plugins.push(...commonPlugins)

const alterClientCb = alterClient && alterClient(clientConfig, 'test')

const clientCompiler = webpack(clientConfig)
injectWHM(clientConfig, clientCompiler, 9080)
clientCompiler.watch({}, (err, stats) => {
  alterClientCb && alterClientCb(err, stats)
  console.log('Client bundles for browser\n', stats.toString({ chunkModules: false, colors: true }), '\n')
})

// Client run in node

clientConfigNode.entry.server = ['./src/client/entry.node.test.js'] // this is client running in node env
clientConfigNode.output.path = require('path').resolve('./test/build/node')
clientConfigNode.output.filename = 'node.test.js'
compileAndTest(clientConfigNode, 'Client')

// Server
compileAndTest(serverConfig, 'Server')

/**
 * @arg {Object} config
 * @arg {string} arch - 'CLIENT' | 'SERVER'
 */

function compileAndTest(config, arch) {
  config.devtool = 'cheap-module-eval-source-map' // eslint-disable-line no-param-reassign
  config.module.rules.push(...ExtractTextLoader)
  config.plugins.push(...commonPlugins)

  const alterConfigCb = arch === 'Client'
    ? (alterClient && alterClient(config, 'testInNode'))
    : (alterServer && alterServer(config, 'test'))

  let child
  webpack(config).watch({}, (err, stats) => {
    console.log(arch + ' bundles for node\n', stats.toString({ colors: true }), '\n')
    alterConfigCb && alterConfigCb(err, stats)

    if (stats.hasErrors()) return

    if (child) child.kill()
    child = require('child_process').fork(require('path').join(config.output.path, config.output.filename))
  })
}

copy()
