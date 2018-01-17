const path = require('path')
const child_process = require('child_process')

const webpack = require('webpack')
// const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { clientConfig, serverConfig, cordovaConfig, copy } = require('./webpack.config')
const { ExtractTextLoader, styleLoader, injectWHM } = require('./common.js')

const { alterClient, alterServer, alterCordova } = (function () {
  try {
    return require('../mwb.config.js') // eslint-disable-line import/no-unresolved
  } catch (e) {
    if (e.message === "Cannot find module '../mwb.config.js'") return {}
    throw e
  }
}())

// get the last argument
// possible values:
// null - run client (browser) and server
// all - run client (brower), server and cordova
// cordovaOnly - run only cordova
const argv = process.argv[2]

// use css module when file name is xxx.module.css
// dont mix global and local css, e.g. in global.css don't @import local.css or vice versa

const commonPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"development"',
  }),
  // new ExtractTextPlugin({ filename: 'styles.css' }), // can't do hot module replacement
]

/**
 * Client
 */

clientConfig.devtool = 'cheap-module-eval-source-map'
clientConfig.output.filename = '[name].js'
clientConfig.module.rules.push(...styleLoader) // styleLoader can have hot module replacement for css on change
// clientConfig.module.rules.push(...ExtractTextLoader)
// clientConfig.module.noParse = /someModuleDist|anotherModuleDist/
clientConfig.plugins.push(...commonPlugins)
clientConfig.performance = { hints: false }

const alterClientCb = (alterClient && alterClient(clientConfig, 'dev'))

const clientCompiler = webpack(clientConfig)
injectWHM(clientConfig, clientCompiler)


let clientStarted = false
if (argv !== 'cordovaOnly') {
  clientCompiler.watch({}, (err, stats) => {
    console.log('Client Bundles \n', stats.toString({ chunkModules: false, colors: true }), '\n')

    alterClientCb && alterClientCb(err, stats)

    if (clientStarted) return

    // the build/webpack-assets.json is ready, so go on create the server bundle
    createServer()
    clientStarted = true
  })
}

/**
 * Server
 */
serverConfig.devtool = 'cheap-module-eval-source-map'

// allow hot module on server side, hmr is the signal to reload
serverConfig.entry.server.push(__dirname + '/signal.js?hmr')  // eslint-disable-line
serverConfig.module.rules.push(ExtractTextLoader[1]) // to handle css module
serverConfig.plugins.push(...commonPlugins)
serverConfig.performance = { hints: false }

const alterServerCb = alterServer && alterServer(serverConfig, 'env')

function createServer() {
  let child

  webpack(serverConfig).watch({}, (err, stats) => {
    console.log('Server Bundle \n', stats.toString({ colors: true }), '\n')

    alterServerCb && alterServerCb(err, stats)

    if (stats.hasErrors()) return
    if (child) {
      child.send('hmr')
      return
    }
    createChild()
  })

  function createChild() {
    child = child_process.fork(path.join(serverConfig.output.path, serverConfig.output.filename))
    const start = Date.now()
    child.on('exit', (code, signal) => {
      console.error('Child server exited with code:', code, 'and signal:', signal)
      child = null
      if (!code) return
      if (Date.now() - start > 1000) createChild() // arbitrarily only after the server has started for more than 1 sec
    })
  }
}

/**
 * Cordova
 */

cordovaConfig.devtool = 'cheap-module-eval-source-map'
cordovaConfig.module.rules.push(...ExtractTextLoader)
// cordovaConfig.module.noParse = /^[@a-z][a-z\/\.\-0-9]*$/i

cordovaConfig.plugins.push(...commonPlugins)
// remove the new webpack.HotModuleReplacementPlugin(),
cordovaConfig.plugins = cordovaConfig.plugins.filter(p => !(p instanceof webpack.HotModuleReplacementPlugin))
cordovaConfig.performance = { hints: false }

const alterCordovaCb = alterCordova && alterCordova(cordovaConfig, 'env')

if (argv === 'all' || argv === 'cordovaOnly') {
  webpack(cordovaConfig).watch({}, (err, stats) => { // eslint-disable-line no-unused-expressions
    console.log('Cordova Bundles \n', stats.toString({ chunkModules: false, colors: true }), '\n')
    alterCordovaCb && alterCordovaCb(err, stats)
  })
}

copy()
