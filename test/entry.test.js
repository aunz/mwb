'use strict'

import tape from 'tape' //can't use import test from 'tape' as test is made global by shelljs/global
import 'shelljs/global'

let start = Date.now()

cd(__dirname)

rm('-rf','build')
mkdir('build')

cd('build')

tape('should install ok',t => {
  //safe guard   
  if (test('-f','package.json')) {throw new Error('No no')}

  //npm init
	t.doesNotThrow(() => { exec('npm init -f',{silent:true}) },'npm init -f')
  //copy the initial package.json into memory 

  //install mwb
  t.doesNotThrow(() => { exec('npm i -D ../../ ',{silent:true}) },'npm i -D ../../ ') 

  let i = cat('package.json')
  t.deepEqual(ls('tool'),['bundle.js','copyStatic.js','dev.js','log-apply-result.js','signal.js','test.js','webpack.config.js','webpack.config.test.js'],'should have correct tool directory structure')  


  //install full
	t.doesNotThrow(() => { exec('npm run mwb initFull',{silent:true}) })
  console.log('Initiation took', Date.now() - start, 'ms')  
  t.equal(cat(ls('package.*.json')[0]),i,'The previous package.json should have been copied')

  let p = require(require('path').resolve('package.json')) //can't just use require('package.json')
  
  t.ok(p.scripts.test &&
       p.scripts.mwb &&
       p.scripts.serve &&
       p.scripts.bundle &&
       p.scripts.clean &&
       p.scripts.start &&
       p.devDependencies.mwb
       ,'Should have all the scrips')

  let k = Object.keys(p.dependencies)
  t.ok(k.indexOf('express') > -1 &&
       k.indexOf('compression') > -1 &&
       k.indexOf('mongodb') > -1 &&
       k.indexOf('react') > -1 &&
       k.indexOf('react-dom') > -1 &&
       k.indexOf('redux') > -1 &&
       k.indexOf('page') > -1
       ,'Should have all the devDep') 

  t.end()
})

tape('Server should response with hello world', t => {
	// t.plan(1)	
	// //mocking stuff
  'export default (s,a)=>s'.to('src/share/reducers/index.js')
  "import React from 'react';export default {['/'](store) {return p => <div>Hello world</div>}}".to('src/share/routes.js')
	let dev = exec('npm run dev',{async:true, silent:true})
	dev.stdout.on('data', data => {
  	if (data.indexOf('Express app listening at') !== -1) {
  		require('http').request('http://localhost:3000', res => {
        console.log(res.statusCode)
  			let body = ''
  			res.on('data', chunk => {
    			body += chunk
  			})
  			res.on('end', () => {

  				t.ok(body.indexOf('Hello world') > -1,'server responsed with "Hello World"')
  				dev.kill()
  				t.end()
  				// exit()
  			})
  		}).end()
  	}
  })
})

tape('Directory structure', t => {
  let dir = ls('')
  t.ok(dir.indexOf('build') > -1 
       && dir.indexOf('db') > -1
       && dir.indexOf('node_modules') > -1
       && dir.indexOf('src') > -1
       && dir.indexOf('test') > -1
       && dir.indexOf('tool') > -1,
       'should have correct base directory structure')

  dir = ls('src')
  t.ok(dir.indexOf('client') > -1 
       && dir.indexOf('server') > -1
       && dir.indexOf('share') > -1
       && dir.indexOf('static') > -1,       
        'should have correct src directory structure')

  dir = ls('src/client')
  t.ok(dir.indexOf('entry.js') > -1 
     && dir.indexOf('entry.test.js') > -1
     && dir.indexOf('main.js') > -1     
     ,'should have correct src/client directory structure')

  dir = ls('src/server')
  t.ok(dir.indexOf('entry.js') > -1 
     && dir.indexOf('entry.test.js') > -1
     && dir.indexOf('main.js') > -1     
     && dir.indexOf('app.js') > -1     
     && dir.indexOf('mongo.js') > -1     
     ,'should have correct src/server directory structure')

  dir = ls('src/share')  
  t.ok(dir.indexOf('actions') > -1 
     && dir.indexOf('Components') > -1
     && dir.indexOf('reducers') > -1     
     && dir.indexOf('html.js') > -1     
     && dir.indexOf('index.html') > -1     
     && dir.indexOf('initialState.js') > -1     
     && dir.indexOf('routes.js') > -1     
     ,'should have correct src/share directory structure')

  dir = ls('tool')
  t.deepEqual(dir,['bundle.js','copyStatic.js','dev.js','log-apply-result.js','signal.js','test.js','webpack.config.js','webpack.config.test.js'],'should have correct tool directory structure')

  t.end()
  
})

tape('Rerun npm i ../../ -D', t => {
  let randomContent = 'Some dummy random content' + Math.random() 
  randomContent.to('tool/dummyfile.txt')

  cd('tool')
  let oldCat = cat(ls(''))

  cd('..')

  t.doesNotThrow(() => { exec('npm i -D ../../',{silent:true}) },'rerun npm i -D ../../')  
  
  cd(ls('tool_backup_*')[0])
  let newCat = cat(ls(''))
  t.ok(newCat.indexOf(randomContent) > -1, 'should have some dummy content')
  t.equal(newCat, oldCat, 'and same as the old tool directory')

  cd('..')
  t.deepEqual(ls('tool'),['bundle.js','copyStatic.js','dev.js','log-apply-result.js','signal.js','test.js','webpack.config.js','webpack.config.test.js'],'should have correct tool directory structure')  

  t.end()
  exit() //shelljs
})