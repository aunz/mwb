'use strict'

const test = require('tape')
require('shelljs/global')

let start = Date.now()

cd(__dirname)

rm('-rf','build')
mkdir('build')

cd('build')

test('should install ok',t => {
	t.plan(3)
	t.doesNotThrow(() => { exec('npm init -f') })
	t.doesNotThrow(() => { exec('npm i ../../ -D') })
	t.doesNotThrow(() => { exec('npm run mwb initFull') })
  console.log('Initiation took', Date.now() - start, 'ms')  
})

test('Server should response with hello world', t => {
	t.plan(1)	
	// //mocking stuff
  'export default (s,a)=>s'.to('src/share/reducers/index.js')
  "import React from 'react';export default {['/'](store) {return p => <div>Hello world</div>}}".to('src/share/routes.js')
	let dev = exec('npm run dev',{async:true})
	dev.stdout.on('data', data => {
  	if (data.indexOf('Express app listening at') !== -1) {
  		require('http').request({port:3000},res => {
  			let body = ''
  			res.on('data', chunk => {
    			body += chunk
  			})
  			res.on('end', () => {
  				t.true(body.indexOf('Hello world') !== -1,'server responsed')
  				dev.kill()
  				t.end()
  				exit()
  			})
  		}).end()
  	}
  })
})