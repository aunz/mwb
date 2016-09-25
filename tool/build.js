const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const cssnano = require('cssnano')

const { clientConfig, serverConfig, cordovaConfig } = require('./webpack.config')

// get the last argument, see the dev.js
const argv = process.argv[2]


const commonLoaders = [{
  test: /\.css$/,
  loader: ExtractTextPlugin.extract('css?module&minimize&localIdentName=[local]_[hash:6]!postcss'),
}]

const commonPlugins = [
  new webpack.DefinePlugin({
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  }),
  new ExtractTextPlugin({
    filename: 'styles_[contenthash:6].css',
    allChunks: true,
  }),
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.AggressiveMergingPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
    sourceMap: false,
    comments: false,
    'screw-ie8': true,
  }),
]


/**
 * Client
 */

clientConfig.module.loaders.push(...commonLoaders)
clientConfig.plugins.push(...commonPlugins)
;(argv !== 'cordovaOnly') && webpack(clientConfig).run((err, stats) => { // eslint-disable-line no-unused-expressions
  console.log('Client Bundles \n', stats.toString({
    colors: true,
  }), '\n')
    // cssnano, temparory work around
  try {
    const fileName = require(path.resolve('build/webpack-assets.json')).client.css // eslint-disable-line
    const filePath = path.resolve('build/public', fileName.replace(/^\/+/, ''))
    const css = fs.readFileSync(filePath)
    cssnano.process(css, { discardComments: { removeAll: true } }).then((result) => {
      fs.writeFileSync(filePath, result.css)
    })
  } catch (e) { /* do nothing */ }
})

/**
 * Server
 */

serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(...commonPlugins)
;(argv !== 'cordovaOnly') && webpack(serverConfig).run((err, stats) => { // eslint-disable-line no-unused-expressions
  console.log('Server Bundle \n', stats.toString({
    colors: true,
  }), '\n')
  require('child_process').exec('rm build/server/styles_??????.css', () => {}) // eslint-disable-line
  // then delele the styles.css in the server folder
  // try {
  // const styleFile = _root+'/build/server/styles.css'
  //  fs.statSync(styleFile) && fs.unlinkSync(styleFile)
  // } catch(e) {/*do nothing*/}
  // file loader may also result in duplicated files from shared React components
})

/**
 * Cordova
 */

cordovaConfig.module.loaders.push(...commonLoaders)
cordovaConfig.plugins.push(...commonPlugins)

// remove the ExtractTextPlugin
cordovaConfig.plugins = cordovaConfig.plugins.filter(p => !(p instanceof ExtractTextPlugin))
// re-add the ExtractTextPlugin with new option
cordovaConfig.plugins.push(new ExtractTextPlugin({ filename: 'styles.css', allChunks: true }))

;(argv === 'all' || argv === 'cordovaOnly') && webpack(cordovaConfig).run((err, stats) => {  // eslint-disable-line no-unused-expressions
  console.log('Cordova Bundles \n', stats.toString({
    colors: true,
  }), '\n')
    // cssnano, temparory work around
  try {
    const filePath = path.resolve(cordovaConfig.output.path, 'styles.css')
    const css = fs.readFileSync(filePath)
    cssnano
      .process(css, { discardComments: { removeAll: true } })
      .then(result => {
        fs.writeFileSync(filePath, result.css)
      })
  } catch (e) { /* do nothing */ }
})
