const path = require('path')

const { clientConfig, serverConfig, } = require('./webpack.config')

// override

/* client */
clientConfig.entry.client = ['./src/client/entry.test.js']
// change the client to node env, using jsdom
clientConfig.output.path = path.resolve('./test/build/public')
clientConfig.output.filename = 'client.test.js'

/* server */
serverConfig.entry.server = ['./src/server/entry.test.js']
serverConfig.output.path = path.resolve('./test/build/server')
serverConfig.output.filename = 'server.test.js'

module.exports = { clientConfig, serverConfig }
