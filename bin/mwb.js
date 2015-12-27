#!/usr/bin/env node
'use strict'

const a = process.argv[2]
const command = {
	postinstall,
	initMin,
	initMongo,
	initReact,	
	init,
	initFull,
}

if (!a || Object.keys(command).indexOf(a) < 0) return console.error('Need to supply an argument, either of:',Object.keys(command))

/** 
 * Dependencies & variables
 */
const path = require('path')
require('shelljs/global')
const templatePath = path.resolve(__dirname,'../template') +'/'


/** The command */
command[a]()



function postinstall () {
	//path.resolve('') -> the node_modules/mwb because this script run within mwb
	try {
		var tmp = require(path.resolve('../../package.json'))		
	} catch (err) {
		console.error(err)
		return
	}
	
	copyTool()

	if (!tmp.scripts) tmp.scripts = {}
	if (tmp.scripts.mwb) return //has been installed already
	
	tmp.scripts.mwb = 'mwb'
	// tmp.private = true //your app shouldn't be published in npm public :)
	// tmp.license = 'UNLICENSED'

	JSON.stringify(tmp,null,2).to('../../package.json')
	setTimeout(()=>{
		require('./ascii_cat.js').cat1()
		console.log('To start with an express js server, type: npm run mwb init\n')
		console.log('Without an express js server, type: npm run mwb initMin\n')
		console.log('To add mongodb, type: npm run mwb initMongo\n')
		console.log('To add a full stack including React, Redux and Page.js, type: npm run mwb initFull\n')
		console.log()				
	})
}


function initMin (){
	console.log(' * Creating src & test folder\n')
	mkdir('-p','src/client','src/share','src/server','src/static')	
	mkdir('-p','test')	
	
	//server
	cp(templatePath + 'entry.js','src/server/entry.js')
	''.toEnd('src/server/app.js')

	//client, just an empty file
	''.toEnd('src/client/entry.js')	

	//test
  ''.toEnd('src/server/entry.test.js')
  ''.toEnd('src/client/entry.test.js')

	//add scripts to the existing package.json file
	//make a copy
	console.log(' * Updating package.json file\n')
	let oldName = 'package.'+Date.now()+'.json'
	cp('package.json',oldName)

	let tmp = require(path.resolve('package.json'))
	if (!tmp.scripts) tmp.scripts = {}		
	tmp.scripts.dev = 'npm run clean && node tool/dev'
	tmp.scripts.serve = 'node build/server/serverBundle'
	tmp.scripts.bundle = 'npm run clean && node tool/bundle'
	tmp.scripts.clean = 'rm -rf build'
	tmp.scripts.test = 'rm -rf test/build && node tool/test'
	JSON.stringify(tmp,null,2).to('package.json')	
	console.log(' * Boilerplate created, package.json file has been updated')
  console.log(' * The old package.json file has been renamed to',oldName,'\n')	
}

function init (){
	initMin()
	
	cp('-f',templatePath + 'expressApp.js','src/server/app.js')		
	cp(templatePath + 'main.js','src/server/main.js')
	console.log('Installing the latest version of express')
	exec('npm i -S express')
	console.log('Installing the latest version of compression')
	exec('npm i -S compression')	
	console.log()
	console.log('Initiation completed, to start developing, type: npm run dev')
}

function initMongo() {
	console.log('Installing the latest version of mongoDB from "node-mongodb-native"')
	exec('npm i -S mongodb')
	
	mkdir('-p','db')

	let tmp = require(path.resolve('package.json'))
	//change the start script
	tmp.scripts.start = process.platform === 'win32' 
	  ? 'start /B mongod --dbpath db --bind_ip 127.0.0.1 && npm run clean && node tool/dev'  //to stop this, has to use ctrl + break, NOT ctrl + c due to the use of start /B
	  : 'npm run clean && node tool/dev'	
	let oldName = 'package.'+Date.now()+'.json'
	cp('package.json',oldName)	
	JSON.stringify(tmp,null,2).to('package.json')
	
	cp(templatePath + 'mongo.js','src/server/mongo.js')

	console.log('\nA folder named db has been created, and package.json has been udpated.')
	console.log('The old package.json file has been renamed to',oldName,'\n')
	console.log('The connection file mongo.js has been added to the src/server folder')
}

function initReact (){

  console.log('Installing the latest version of React & react-dom & redux')
  exec('npm i -S react react-dom redux @aunz/simple-template')

  mkdir('-p',
    'src/share/actions/constants',
    'src/share/Components',
    'src/share/reducers')
  console.log('Folder actions, components, reducers has been created under share directory')

  //server
  cp('src/server/main.js','src/server/main.'+Date.now()+'.js') //backup
	cp('-f',templatePath + 'mainWithReact_server.js','src/server/main.js')

	//client
  cp('src/client/entry.js','src/client/entry.'+Date.now()+'.js') //backup
	cp('-f',templatePath + 'entry.js','src/client/entry.js')

  cp('src/client/main.js','src/client/main.'+Date.now()+'.js') //backup
	cp('-f',templatePath + 'mainWithReact_client.js','src/client/main.js')

  //share
	cp(templatePath + 'index.html','src/share/index.html')
	cp(templatePath + 'html.js','src/share/html.js')
	cp(templatePath + 'routes.js','src/share/routes.js')
	cp(templatePath + 'initialState.js','src/share/initialState.js')	

	cp(templatePath + 'actions.js','src/share/actions/index.js')
	cp(templatePath + 'actionCreators.js','src/share/actions/actionCreator.js')
	
	cp(templatePath + 'reducers.js','src/share/reducers/index.js')	
	cp(templatePath + 'reducerCreators.js','src/share/reducers/reducerCreator.js')
	''.toEnd('src/share/constants.js')

}

function initPage (){
	console.log('Installing the latest version of Page from "visionmedia/page.js"')
  exec('npm i -S page')

}



function initFull (){
	init()
	initMongo()
	initReact()
	initPage()
}

function copyTool() {
	console.log(path.resolve())
  if (test('-d','../../tool')) {
  	//make a copy
  	console.log('backing up the tool directory')
  	cp('-rf','../../tool/*','../../tool_backup_'+Date.now())
  	rm('-rf','../../tool')
  }
  cp('-rf','tool/*','../../tool')
}