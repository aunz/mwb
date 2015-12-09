"use strict"

const path = require('path')
const _root = path.resolve()

const webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const postcss = () => [require('autoprefixer')]



let commonLoaders = [{
  test: /\.jsx?$/,
  exclude: /(node_modules)/,
  loader: 'babel',
  query: {
    presets: ['react', 'es2015', 'stage-0'],
    plugins: ['transform-runtime'], //
    cacheDirectory: true, //cache into OS temp folder by default
  }
}, {
  test: /png|jpg|jpeg|gif|mp3/,
  loader: 'url?limit=10000&name=[name]_[hash:6].[ext]',
}, {
  test: /txt/,
  loader: 'raw',
}, {
  test: /json/,
  loader: 'json'
}]

try {
	const extraLoaders = require(_root+'/src/loaders.json')	
	commonLoaders.push(...extraLoaders)
} catch (e) {/*do nothing if the json is not found*/}


let commonPlugins = [
	new webpack.optimize.OccurrenceOrderPlugin(),
	new webpack.NoErrorsPlugin(),
]

try {
	const extraPlugins = require(_root+'/src/plugins.json')	
	commonPlugins.push(...extraPlugins)
} catch (e) {/*do nothing if the json is not found*/}


let clientConfig = {
	entry: {
		client: ['./src/client/entry.js']
	},	
	output: {
		path: './build/client', 
		// filename: 'clientBundle.js', //during development
		filename: 'clientBundle_[hash:6].js',		
	},
	module: {
	  loaders: [...commonLoaders],
	  noParse: [],
	},
	resolve: {
		alias: {}
	},	
	postcss,
	plugins: [
		...commonPlugins,
		new AssetsPlugin({path:'./build'}),
		new webpack.DefinePlugin({__CLIENT__ : true})
		// new HtmlWebpackPlugin(),
	],
	

}


let serverConfig = {
	entry: {
		server: ['./src/server/entry.js']
	},
	target: 'node',	
	output: {
		path: './build/server',
		filename: 'serverBundle.js',
		libraryTarget: 'commonjs2',
	},
	module: {
	  loaders: [...commonLoaders],	  
	},
	postcss,
	plugins: [
		...commonPlugins,
		new webpack.DefinePlugin({__SERVER__:true})
	],
	externals: [
		/^[@a-z][a-z\/\.\-0-9]*$/i, //native modules will be excluded, e.g require('react/server')
		/^.+assets\.json$/i, //these assets produced by assets-webpack-plugin
	],
	node: {
		console: true,
		__filename: true,
		__dirname: true,
	}
}


module.exports = [clientConfig,serverConfig]