const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const cssnano = require('cssnano')

const { clientConfig, serverConfig, cordovaConfig } = require('./webpack.config')
const { ExtractTextLoader } = require('./common')

// get the last argument, see the dev.js
const argv = process.argv[2]

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

clientConfig.module.rules.push(...ExtractTextLoader)
clientConfig.plugins.push(...commonPlugins)
const commonsChunk = new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: ({ resource }) => /node_modules/.test(resource), // could use /node_modules.*\.jsx?$/ to only process js
})
clientConfig.plugins.push(new webpack.HashedModuleIdsPlugin(), commonsChunk)
// clientConfig.plugins.push(commonsChunk, new require('webpack-chunk-hash'))

/*
  There are 3+ ways to dynamically create vendor chunk for long term caching using CommonsChunkPlugin
  After creating a commonChunk
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({ resource }) => /node_modules/.test(resource),
    })

  1) Add new require('webpack-md5-hash') or require('webpack-chunk-hash')
    The hash will be based on content, the manifest webpackJsonp function will be in the entry chunk, in this case the vendor chunk
    There will output 2 files: vendor.xx.js and client.xx.js
    vendor.xx.js is the entry chunk and will be loaded first
  2) Add another commonChunk
    new webpack.optimize.CommonsChunkPlugin('manifest') <-- can be any name, such as 'meta'
    this will create a manifest.[xxx].js or meta.[xxx].js which contains the webpackJsonp functions
    There will create 3 files: manifest.xx.js, vendor.xx.js and client.xx.js
    When the client code changes, the xx in client.xx.js and the xx in manifest.xx.js will change
    the xx in vendor.xx.js will be the same
    no need extra plugin, but will results in 3 http requests
  3) Add new require('chunk-manifest-webpack-plugin') after adding new webpack.optimize.CommonsChunkPlugin('manifest')
    This plugin extract the manifest into a json file
    Then will need inline-manifest-webpack-plugin to insert the json into the intial html along with html-webpack-plugin
    This will result in 2 files: vendor.xx.js and client.xx.js

  ** I have decided to go for option 1 as it seems simplest, clients only need to make 2 http request, but need to be dependent on the md5 plugins
*/


if (argv !== 'cordovaOnly') {
  webpack(clientConfig).run((err, stats) => {
    if (err) throw err
    console.log('Client Bundles \n', stats.toString({
      colors: true,
    }), '\n')
    // cssnano, temparory work around
    const assets = require(path.resolve('build/webpack-assets.json')) // eslint-disable-line import/no-dynamic-require
    for (const entry in assets) { // eslint-disable-line
      const filename = assets[entry].css
      if (filename) {
        const filePath = path.resolve('build/public', filename.replace(/^\/+/, ''))
        fs.readFile(filePath, (e, css) => {
          cssnano.process(css, { discardComments: { removeAll: true } })
            .then(result => {
              fs.writeFile(filePath, result.css, () => {})
            })
        })
      }
    }
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

if (argv !== 'cordovaOnly') {
  webpack(serverConfig).run((err, stats) => {
    if (err) throw err
    console.log('Server Bundle \n', stats.toString({
      colors: true,
    }), '\n')
    require('child_process').exec('rm build/server/styles.css', () => {}) // delele the styles.css in the server folder
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

if (argv === 'all' || argv === 'cordovaOnly') {
  webpack(cordovaConfig).run((err, stats) => { // eslint-disable-line no-unused-expressions
    if (err) throw err
    console.log('Cordova Bundles \n', stats.toString({
      colors: true,
    }), '\n')

    const filePath = path.resolve(cordovaConfig.output.path, 'styles.css')
    fs.readFile(filePath, (e, css) => {
      cssnano.process(css, { discardComments: { removeAll: true } })
        .then(result => {
          fs.writeFile(filePath, result.css, () => {})
        })
    })
  })
}
