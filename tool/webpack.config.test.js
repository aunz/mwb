const AssetsPlugin = require('assets-webpack-plugin')

const { clientConfig, serverConfig, } = require('./webpack.config')

// override

/* client */
clientConfig.entry.client = ['./src/client/entry.test.js']
// change the client to node env, using jsdom
clientConfig.output = {
  path: './test/build/client',
  filename: 'clientBundle.test.js',
}

clientConfig.node = { fs: 'empty' }

// remove the assetplugin for client
clientConfig.plugins = clientConfig.plugins.filter(p => !(p instanceof AssetsPlugin))


/* server */
serverConfig.entry.server = ['./src/server/entry.test.js']
serverConfig.output = {
  path: './test/build/server',
  filename: 'serverBundle.test.js',
  libraryTarget: 'commonjs2',
}

module.exports =  { clientConfig, serverConfig }
