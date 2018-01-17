// 1: deps

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OfflinePlugin = require('offline-plugin')

// 2: config
const { clientConfig, serverConfig, cordovaConfig, copy } = require('./webpack.config')
const { ExtractTextLoader } = require('./common')

// 3: args from cli
const argv = process.argv[2]


// 4: hooks
const { alterClient, alterServer, alterCordova } = (function () {
  try {
    return require('../mwb.config.js')
  } catch (e) {
    if (e.message === "cannot find module '../mwb.config.js'") return {}
    throw e
  }
}())

const commonPlugins = [
  new webpack.DefinePlugin({
    'process.env.TEST': false,
    'process.env.NODE_ENV': '"production"',
  }),
  new ExtractTextPlugin({
    filename: 'styles_[contenthash:7].css',
    allChunks: false, // default, so when using System.import(), css will be inlined into <style />
  }),
  new webpack.optimize.AggressiveMergingPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
      output: {
        comments: false
      }
    }
  }),
]


/**
 * Client
 */

clientConfig.module.rules.push(...ExtractTextLoader)
clientConfig.plugins.push(...commonPlugins, new OfflinePlugin({ ServiceWorker: { minify: true } }))
const vendorChunk = new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: ({ resource }) => /node_modules/.test(resource), // could use /node_modules.*\.jsx?$/ to only process js
})
const manifestChunk = new webpack.optimize.CommonsChunkPlugin({ name: 'manifest' })
clientConfig.plugins.push(new webpack.HashedModuleIdsPlugin(), vendorChunk, manifestChunk)

const alterClientCb = alterClient && alterClient(clientConfig, 'build')


if (argv !== 'cordovaOnly') {
  webpack(clientConfig).run((err, stats) => {
    alterClientCb && alterClientCb(err, stats)

    if (err) throw err
    console.log('Client Bundles \n', stats.toString({ colors: true }), '\n')

    // cssnano, temparory work around
    // const assets = require(path.resolve('build/webpack-assets.json')) // eslint-disable-line import/no-dynamic-require
    // for (const entry in assets) { // eslint-disable-line
    //   const filename = assets[entry].css
    //   if (filename) {
    //     const filePath = path.resolve('build/public', filename.replace(/^\/+/, ''))
    //     furtherProcessCss(filePath)
    //   }
    // }
  })
}

/**
 * Server
 */

serverConfig.module.rules.push(ExtractTextLoader[1]) // handle the css module
serverConfig.plugins.push(...commonPlugins)
// remove the ExtractTextPlugin
serverConfig.plugins = serverConfig.plugins.filter(p => !(p instanceof ExtractTextPlugin))
// re-add the ExtractTextPlugin with new option
serverConfig.plugins.push(new ExtractTextPlugin({ filename: 'styles.css', allChunks: true })) // set allChunks to true to move all css into styles.css which will be deleted in the following build step

const alterServerCb = alterServer && alterServer(serverConfig, 'build')

if (argv !== 'cordovaOnly') {
  webpack(serverConfig).run((err, stats) => {
    alterServerCb && alterServerCb(err, stats)

    if (err) throw err
    console.log('Server Bundle \n', stats.toString({ colors: true, }), '\n')
    require('fs').unlink('./build/server/styles.css', () => {}) // delele the styles.css in the server folder
    // try {
    // const styleFile = _root + '/build/server/styles.css'
    //  fs.statSync(styleFile) && fs.unlinkSync(styleFile)
    // } catch(e) {/*do nothing*/}
    // file loader may also result in duplicated files from shared React components
  })
}

/**
 * Cordova
 */

cordovaConfig.module.rules.push(...ExtractTextLoader)
cordovaConfig.plugins.push(...commonPlugins)

// remove the ExtractTextPlugin
cordovaConfig.plugins = cordovaConfig.plugins.filter(p => !(p instanceof ExtractTextPlugin))
// re-add the ExtractTextPlugin with new option
cordovaConfig.plugins.push(new ExtractTextPlugin({ filename: 'styles.css', allChunks: true }))

const alterCordovaCb = alterCordova && alterCordova(cordovaConfig, 'build')

if (argv === 'all' || argv === 'cordovaOnly') {
  webpack(cordovaConfig).run((err, stats) => { // eslint-disable-line no-unused-expressions
    alterCordovaCb(err, stats)
    if (err) throw err
    console.log('Cordova Bundles \n', stats.toString({ colors: true }), '\n')

    const filePath = require('path').resolve(cordovaConfig.output.path, 'styles.css')
    furtherProcessCss(filePath)
  })
}

function furtherProcessCss(filePath) {
  const fs = require('fs')
  const { promisify } = require('util')
  promisify(fs.readFile)(filePath)
    .then(css => require('cssnano').process(css, { discardComments: { removeAll: true } }))
    .then(result => promisify(fs.writeFile)(filePath, result.css))
    .catch(console.err)
}

copy()