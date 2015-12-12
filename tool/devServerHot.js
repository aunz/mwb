'use strict'


/**
 * Dependencies 
 */
const path = require('path')
const _root = path.resolve()

const webpack = require('webpack')

let commonLoaders = [
  {test: /\.css$/, loader: 'style!css?modules!postcss' }
]

let commonPlugins = [
  new webpack.HotModuleReplacementPlugin(),
  new webpack.DefinePlugin({
    __DEV__ : true,
    'process.env.NODE_ENV':'"development"'
  }),
]

/**
 * Client
 */
let clientConfig  = require('./webpack.config.js').clientConfig
clientConfig.devtool = 'eval'

//add hot middleware on port 8080
clientConfig.entry.client.push('webpack-hot-middleware/client?reload=true&noInfo=true&path=http://localhost:8080/__webpack_hmr&overlay=false')
clientConfig.output.filename = 'clientBundle.js'
clientConfig.module.loaders.push(...commonLoaders)
clientConfig.plugins.push(...commonPlugins)

/* Adding alias and noParse during development only
 * For production, these settings in commbination with UglifyJsPlugin make build 10x slower
 */
try {
  const alias = require(_root+'/src/alias.json')
  clientConfig.resolve.alias = alias
  Object.keys(alias).forEach( k => {
    clientConfig.module.noParse.push(path.resolve('.','node_modules',alias[k]))
  })
} catch (e) {/*do nothing if the alias.json is not present*/}

let clientCompiler = webpack(clientConfig)
clientCompiler.watch({},(err,stats) => {  
  console.log('Client Bundles \n',stats.toString({chunkModules: false,colors:true}),'\n')
  // console.log('Client Bundles \n',stats.toString({colors:true}),'\n')
})


//use inbuilt http module 
require('http').createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  require('webpack-hot-middleware')(clientCompiler)(req,res)
}).listen(8080)


/**
 * Server
 */
let serverConfig  = require('./webpack.config.js').serverConfig
serverConfig.devtool = 'eval'

//allow hot module on server side
serverConfig.entry.server.push(__dirname+'/signal.js?hmr')
serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(...commonPlugins)


let child
webpack(serverConfig).watch({},(err, stats) => {
  console.log('Server Bundle \n',stats.toString({colors:true}),'\n')  
  if (stats.hasErrors()) return
  if (child) return child.send('hmr')

  createChild()
 
  function createChild(){
  	child = require('child_process').fork(path.join(serverConfig.output.path,serverConfig.output.filename))
  	let start = Date.now()
  	child.on('exit', (code, signal) => {
  		console.error('Child server exited with code:',code,'and signal:',signal)
      child = null
  		// if (!code) return
  		// if (Date.now() - start > 1000) createChild() //arbitrarily only after the server has started for more than 1 sec  		
  	})  
  }
})