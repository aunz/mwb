const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { cssLoader, injectWHM } = require('./common')

const { clientConfig, serverConfig, } = require('./webpack.config.test')
const clientConfigNode = require('lodash/cloneDeep')(clientConfig)

const commonPlugins = [
  new webpack.DefinePlugin({
    'process.env.TEST': true,
    'process.env.NODE_ENV': '"development"',
  }),
  new ExtractTextPlugin({ filename: 'styles.css', allChunks: false }), // has to use this for universal server client rendering
]


// Client run in browser
clientConfig.devtool = 'cheap-module-eval-source-map' // eslint-disable-line no-param-reassign
clientConfig.module.rules.push(...cssLoader)
clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
clientConfig.plugins.push(...commonPlugins)

const clientCompiler = webpack(clientConfig)
injectWHM(clientConfig, clientCompiler, 9080)
clientCompiler.watch({}, (err, stats) => {
  console.log('Client Bundles in for browser \n', stats.toString({ chunkModules: false, colors: true }), '\n')
})

// Client run in node
clientConfigNode.entry.client = ['./src/client/entry.node.test.js']
clientConfigNode.output.filename = './src/client/client.node.js'
compileAndTest(clientConfigNode, 'CLIENT')

// Server
compileAndTest(serverConfig, 'SERVER')

/**
 * @arg {Object} config
 * @arg {string} arch - 'CLIENT' | 'SERVER'
 */

function compileAndTest(config, arch) {
  config.devtool = 'cheap-module-eval-source-map' // eslint-disable-line no-param-reassign
  config.module.rules.push(...cssLoader)
  config.plugins.push(...commonPlugins)

  let child
  webpack(config).watch({}, (err, stats) => {
    if (stats.hasErrors()) {
      console.log(arch + '\n', stats.toString({ colors: true }))
      return
    }
    if (child) child.kill()
    child = require('child_process').fork(require('path').join(config.output.path, config.output.filename))
  })
}
