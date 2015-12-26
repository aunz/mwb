'use strict'

let clientConfig  = require('./webpack.config.js').clientConfig
let serverConfig  = require('./webpack.config.js').serverConfig

//override
clientConfig.entry.client = ['./src/client/entry.test.js']
//change the client to node env, using jsdom
clientConfig.output = {
	path: './test/client',
	filename: 'clientBundle.test.js',
	libraryTarget: 'commonjs2',
}
clientConfig.externals = [
	/^[@a-z][a-z\/\.\-0-9]*$/i, //native modules will be excluded, e.g require('react/server')
	/^.+assets\.json$/i, //these assets produced by assets-webpack-plugin
]

serverConfig.entry.server = ['./src/server/entry.test.js']
serverConfig.output = {
	path: './test/server',
	filename: 'serverBundle.test.js',
	libraryTarget: 'commonjs2',
}

module.exports = {clientConfig,serverConfig}