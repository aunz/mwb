'use strict' //eslint-disable-line

/**
 * Dependencies
 */

const path = require('path')
  // const _root = path.resolve()
const fs = require('fs')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const clientConfig = require('./webpack.config.js').clientConfig
const serverConfig = require('./webpack.config.js').serverConfig

const commonLoaders = [{
  test: /\.css$/,
  loader: ExtractTextPlugin.extract('css?module&minimize&localIdentName=[local]_[hash:6]!postcss'),
}]
const commonPlugins = [
  new webpack.DefinePlugin({
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  }),
  new ExtractTextPlugin('styles_[contenthash:6].css', {
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
webpack(clientConfig).run((err, stats) => {
  console.log('Client Bundles \n', stats.toString({
    colors: true,
  }), '\n')
    // cssnano, temparory work around
  try {
    const fileName = require(path.resolve('build/webpack-assets.json')).client.css
    const filePath = path.resolve('build/public', fileName)
    const css = fs.readFileSync(filePath)
    require('cssnano').process(css, { discardComments: { removeAll: true } }).then((result) => {
      require('fs').writeFileSync(filePath, result.css)
    })
  } catch (e) { /* do nothing */ }
})
  /**
   * Server
   */
serverConfig.module.loaders.push(...commonLoaders)
serverConfig.plugins.push(...commonPlugins)
webpack(serverConfig).run((err, stats) => {
  console.log('Server Bundle \n', stats.toString({
    colors: true,
  }), '\n')
  require('child_process').execSync('rm build/server/styles_??????.css')
  // then delele the styles.css in the server folder
  // try {
  // const styleFile = _root+'/build/server/styles.css'
  //  fs.statSync(styleFile) && fs.unlinkSync(styleFile)
  // } catch(e) {/*do nothing*/}
  // file loader may also result in duplicated files from shared React components
})
