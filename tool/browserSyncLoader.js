"use strict"
//this loader replace the /*BROWSERSYNC INJECTION*/ into something else


module.exports = function (source){
	this.cacheable()	
	return source.replace(/\/\*BROWSERSYNC INJECTION\*\//,';('+bs.toString()+')()')
	// return source
}

function bs(){	
	require('browser-sync').create().init({
		server: './build/client',
	  middleware: app,
	  port: 3000,
	  files: [
	  	"./build/server/**/*.*",
	  	"./build/client/**/*.*"	  	
	  ],
	  // proxy: {
	  // 	target: 'localhost:8080',
	  // 	ws: true,
	  // },
		open: false,
		notify: false,
		logFileChanges: false,
		logLevel: 'warn',
	})
	
}