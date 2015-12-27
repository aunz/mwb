'use strict'


/**
 * Dependencies 
 */
const path = require('path')
const _root = path.resolve()

const webpack = require('webpack')
const ExtractTextPlugin = require("extract-text-webpack-plugin")

let clientConfig  = require('./webpack.config.js').clientConfig
let serverConfig  = require('./webpack.config.js').serverConfig


let commonLoaders = [
  {test: /\.css$/, loader: ExtractTextPlugin.extract('css?module&localIdentName=[local]_[hash:6]!postcss') } 
]

let commonPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    __DEV__ : true,
    'process.env.NODE_ENV':'"development"'
  }),
  new ExtractTextPlugin("styles.css",{allChunks:true}) //has to use this for universal server client rendering
]

/**
 * Client
 */

clientConfig.devtool = 'cheap-module-eval-source-map'
//add hot middleware on port 8080
clientConfig.entry.client.push('webpack-hot-middleware/client?path=http://localhost:8080/__webpack_hmr&overlay=false&reload=true&noInfo=true&quiet=true')
clientConfig.output.filename = 'clientBundle.js'
clientConfig.module.loaders.push(
  ...commonLoaders 
)

clientConfig.plugins.push(
  ...commonPlugins
)

let clientCompiler = webpack(clientConfig)

let clientStarted = false
clientCompiler.watch({},(err,stats) => {
  console.log('Client Bundles \n',stats.toString({chunkModules: false,colors:true}),'\n')
  // console.log('Client Bundles \n',stats.toString({colors:true}),'\n')
  
  if (clientStarted) return
  // the build/webpack-assets.json is ready, so go on create the server bundle
  createServer()
  clientStarted = true
})


//use inbuilt http module 
require('http').createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  require('webpack-hot-middleware')(clientCompiler,{log:false})(req,res)
}).listen(8080)


/**
 * Server
 */
serverConfig.devtool = 'cheap-module-eval-source-map'

//allow hot module on server side
serverConfig.entry.server.push(__dirname+'/signal.js?hmr')  //hmr is the signal to re load
serverConfig.module.loaders.push(
  ...commonLoaders
)

serverConfig.plugins.push(
  ...commonPlugins
)


function createServer() {
  let child

  webpack(serverConfig).watch({},(err, stats) => {
    console.log('Server Bundle \n',stats.toString({colors:true}),'\n')  
    if (stats.hasErrors()) return
    if (child) return child.send('hmr')  
    createChild()
  })

  function createChild(){
    child = require('child_process').fork(path.join(serverConfig.output.path,serverConfig.output.filename))
    let start = Date.now()
    child.on('exit', (code, signal) => {
      console.error('Child server exited with code:',code,'and signal:',signal)
      child = null
      if (!code) return
      if (Date.now() - start > 1000) createChild() //arbitrarily only after the server has started for more than 1 sec      
    })  
  }  
}

