"use strict"
//this loader replace the /*WEBPACKHOTDEV INJECTION*/ into something else


module.exports = function (source){
	this.cacheable()	
	return source.replace(/\/\*WEBPACKHOTDEV INJECTION\*\//,';('+injectHotLoader.toString()+')()')
	// return source
}

function injectHotLoader(){	
	const path = __non_webpack_require__('path')
	const webpack = __non_webpack_require__('webpack')
	
	let config = __non_webpack_require__('../../tool/webpack.config.js')
	config.entry.client.push('webpack-hot-middleware/client?reload=true&noInfo=true&')
	
	// config.output.path = '/'
	// config.devtool = 'eval'
	config.plugins.push(
	  new webpack.optimize.OccurrenceOrderPlugin(),
	  new webpack.HotModuleReplacementPlugin(),
	  new webpack.NoErrorsPlugin()
	)

	//clean up



	//compiler
	let compiler = webpack(config)
	compiler.watch({},(err,stats) => {
		console.log(stats.toString({colors:true}))
	})

	app.use(__non_webpack_require__('webpack-hot-middleware')(compiler))
}