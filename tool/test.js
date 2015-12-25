'use strict'


/**
 * Dependencies 
 */
const path = require('path')
const _root = path.resolve()
const webpack = require('webpack')

let {clientConfig,serverConfig}  = require('./webpack.config.js')
const ExtractTextPlugin = require("extract-text-webpack-plugin")

let commonLoaders = [
  {test: /\.css$/, loader: ExtractTextPlugin.extract('css?module&localIdentName=[local]_[hash:6]!postcss') } 
]

let commonPlugins = [  
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
clientConfig.module.loaders.push(...commonLoaders)
clientConfig.plugins.push(...commonPlugins)

compileAndTest(clientConfig,'CLIENT')

/**
 * Server
 */
serverConfig.devtool = 'cheap-module-eval-source-map'
serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(...commonPlugins)

compileAndTest(serverConfig,'SERVER')

function compileAndTest(config,arch) {
  let child
  webpack(config).watch({},(err,stats) => {  
    if (stats.hasErrors()) return console.log(arch+'\n',stats.toString({colors:true})) 
    if (child) child.kill()   
    child = require('child_process').fork(path.join(config.output.path,config.output.filename)
  })
}