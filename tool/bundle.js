'use strict'

/**
 * Dependencies 
 */
const path = require('path')
const _root = path.resolve()
const webpack = require('webpack')

const ExtractTextPlugin = require("extract-text-webpack-plugin")

let commonLoaders = [
	{test: /\.css$/, loader: ExtractTextPlugin.extract('css?module&minimize&localIdentName=[local]_[hash:6]!postcss') }
]

let commonPlugins = [
	new webpack.DefinePlugin({
		__DEV__ : false,
		'process.env.NODE_ENV' : '"production"'
	}),
	new webpack.optimize.DedupePlugin(),
	new webpack.optimize.AggressiveMergingPlugin(),
	new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}, sourceMap: false}),	
]




/**
 * Client
 */
let clientConfig  = require('./webpack.config.js').clientConfig

clientConfig.module.loaders.push(...commonLoaders)
clientConfig.plugins.push(...commonPlugins,new ExtractTextPlugin("styles_[contenthash:6].css",{allChunks:true}))

webpack(clientConfig).run((err,stats) => {  
	console.log('Client Bundles \n',stats.toString({colors:true}),'\n')
})


/**
 * Server
 */
let serverConfig  = require('./webpack.config.js').serverConfig
serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(...commonPlugins)


webpack(serverConfig).run((err, stats) => {
  console.log('Server Bundle \n',stats.toString({colors:true}),'\n')  
})