'use strict'

const {clientConfig,serverConfig} = require('./webpack.config.js')

//override
clientConfig.entry.client = ['./test/client/entry.js']
clientConfig.output = {
	path: './test/build/client',
	filename: 'clientBundle.test.js'
}

serverConfig.entry.client = ['./test/server/entry.js']
serverConfig.output = {
	path: './test/build/server',
	filename: 'serverBundle.test.js'
}

module.exports = {clientConfig,serverConfig}