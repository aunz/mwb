const path = require('path')
const http = require('http')
const child_process = require('child_process')

const webpack = require('webpack')
const webpackHotMiddleware = require('webpack-hot-middleware')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const { clientConfig, serverConfig, cordovaConfig } = require('./webpack.config')

// get the last argument
// possible values:
// null - run client (browser) and server
// all - run client (brower), server and cordova
// cordovaOnly - run only cordova
const argv = process.argv[2]

// use css module when file name is xxx.module.css
// dont mix global and local css, e.g. in global.css don't @import local.css or vice versa
const cssLoader = [{
  test: /^((?!\.module).)*css$/i,
  loader: ExtractTextPlugin.extract({
    loader: ['css-loader', 'postcss-loader']
  })
}, {
  test: /\.module\.css$/i,
  loader: ExtractTextPlugin.extract({
    loader: ['css-loader?module&localIdentName=[local]_[hash:base64:5]', 'postcss-loader']
  })
}]

const commonPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"development"',
  }),
  new ExtractTextPlugin({ filename: 'styles.css' }), // has to use this for universal server client rendering
]

/**
 * Client
 */

clientConfig.devtool = 'cheap-module-eval-source-map'
// add hot middleware on port 8080
clientConfig.entry.client.push('webpack-hot-middleware/client?path=http://' + getIp() + ':8080/__webpack_hmr&overlay=false&reload=true&noInfo=true&quiet=true') // getIP so that other devices can connect to the HMR
clientConfig.output.filename = '[name].js'
clientConfig.module.rules.push(...cssLoader)
// clientConfig.module.noParse = /someModuleDist|anotherModuleDist/
clientConfig.plugins.push(...commonPlugins)
clientConfig.performance = { hints: false }

const clientCompiler = webpack(clientConfig)

let clientStarted = false
if (argv !== 'cordovaOnly') {
  clientCompiler.watch({}, (err, stats) => {
    console.log('Client Bundles \n', stats.toString({ chunkModules: false, colors: true }), '\n')
    // console.log('Client Bundles \n',stats.toString({colors:true}),'\n')

    if (clientStarted) return
    // the build/webpack-assets.json is ready, so go on create the server bundle
    createServer()
    clientStarted = true
  })
}


// use inbuilt http module
if (argv !== 'cordovaOnly') {
  http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    webpackHotMiddleware(clientCompiler, { log: false })(req, res)
  }).listen(8080)
}


/**
 * Server
 */
serverConfig.devtool = 'cheap-module-eval-source-map'

// allow hot module on server side, hmr is the signal to reload
serverConfig.entry.server.push(__dirname + '/signal.js?hmr')  // eslint-disable-line
serverConfig.module.rules.push(cssLoader[1]) // to handle css module
serverConfig.plugins.push(...commonPlugins)
serverConfig.performance = { hints: false }


function createServer() {
  let child

  webpack(serverConfig).watch({}, (err, stats) => {
    console.log('Server Bundle \n', stats.toString({ colors: true }), '\n')
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
cordovaConfig.module.rules.push(...cssLoader)
// cordovaConfig.module.noParse = /^[@a-z][a-z\/\.\-0-9]*$/i

cordovaConfig.plugins.push(...commonPlugins)
// remove the new webpack.HotModuleReplacementPlugin(),
cordovaConfig.plugins = cordovaConfig.plugins.filter(p => !(p instanceof webpack.HotModuleReplacementPlugin))
cordovaConfig.performance = { hints: false }

if (argv === 'all' || argv === 'cordovaOnly') {
  webpack(cordovaConfig).watch({}, (err, stats) => { // eslint-disable-line no-unused-expressions
    console.log('Cordova Bundles \n', stats.toString({ chunkModules: false, colors: true }), '\n')
  })
}

function getIp() {
  const interfaces = require('os').networkInterfaces()
  const addresses = []
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2]
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address)
      }
    }
  }
  return addresses[1]
}
