'use strict'




/**
 * Dependencies 
 */
const path = require('path')
const child_process = require('child_process')

const webpack = require('webpack')


/**
 * BrowserSync
 */
// const bs = require('browser-sync').create()
// bs.init({
// 	// server: './build/client',
//   // middleware: app,
//   port: 3000,
//   files: [
//   	{
//   		match:["./build/server/**/*.*"], 
//   		fn: (event, file) => {setTimeout(()=>{bs.reload()},500)} //a little hack here, wait ~0.5 sec before reloading
//   	},
//   	"./build/client/**/*.*",  	
//   ],
//   proxy: {
//   	target: 'localhost:8080',
//   	ws: true,
//   },
// 	open: false, //prevent browsers from opening automatically
// 	notify: false, //do not show notification in browsers
// 	logFileChanges: false, 
// 	logLevel: 'warn',
// })




/**
 * Client
 */
let clientConfig  = require('./webpack.config.js')[0]
// clientConfig.devtool = 'eval'
/*clientConfig.entry.client.push('webpack-hot-middleware/client?reload=true&noInfo=true&')
clientConfig.plugins.push(
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoErrorsPlugin()
)*/

webpack(clientConfig).watch({},(err,stats) => {
	if (!stats.hasErrors())	console.log('Client Bundles \n',stats.toString({colors:true}),'\n')
})



/**
 * Server
 */
let serverConfig  = require('./webpack.config.js')[1]
// serverConfig.devtool = 'source-map'


/*serverConfig.module.loaders.push({
	test: serverConfig.entry.server,
	loader: path.join(__dirname,"browserSync.js")
})*/
serverConfig.plugins.push(new webpack.BannerPlugin({ banner: 'require("source-map-support").install();',raw:true,entryOnly:false}))

/* The server being forked */
let child
webpack(serverConfig).watch({},(err, stats) => {
	if (child) child.kill()
  console.log('Server Bundle \n',stats.toString({colors:true}),'\n')	

  createChild()

  function createChild(){
  	child = child_process.fork(path.join(serverConfig.output.path,serverConfig.output.filename), {
  		env: {port:8080}
  	})
  	let start = Date.now()
  	child.on('exit', (code, signal) => {
  		console.error('Child server exited with code:',code,'and signal:',signal)
  		if (!code) return
  		if (Date.now() - start > 1000) createChild() //arbitrarily only after the server has started for more than 1 sec
  		
  	})  	
  }
})