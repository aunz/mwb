'use strict'

/**
 * Dependencies 
 */
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')

const _root = path.resolve()
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

clientConfig.module.loaders.push(
  ...commonLoaders
)

clientConfig.plugins.push(
  ...commonPlugins,
  new ExtractTextPlugin("styles_[contenthash:6].css",{allChunks:true})
)

webpack(clientConfig).run((err,stats) => {  
	console.log('Client Bundles \n',stats.toString({colors:true}),'\n')
	//cssnano, temparory work around
	const fileName = require(path.resolve('build/webpack-assets.json')).client.css
	const filePath = path.resolve('build/public',fileName)	
	let css = fs.readFileSync(filePath)
	require('cssnano').process(css).then((result)=>{
		require('fs').writeFileSync(filePath, result.css)
	})

})


/**
 * Server
 */
let serverConfig  = require('./webpack.config.js').serverConfig
serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(
  ...commonPlugins,
  new ExtractTextPlugin("styles.css",{allChunks:true})
)


webpack(serverConfig).run((err, stats) => {
  console.log('Server Bundle \n',stats.toString({colors:true}),'\n') 
  // then delele the styles.css in the server folder
  const styleFile = _root+'/build/server/styles.css'
  fs.statSync(styleFile) && fs.unlinkSync(styleFile)


})

