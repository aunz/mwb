import path from 'path'
import child_process from 'child_process'
import fs from 'fs'

import tape from 'tape' // can't use import test from 'tape' as test is made global by shelljs/global
import 'shelljs/global'

const start = Date.now()

process.chdir(__dirname)

child_process.execSync('rm -R build')
fs.mkdirSync('build')

process.chdir('build')

tape('should install ok', t => {
  // safe guard
  try {
    fs.statSync('package.json') // this file shouldn't exist
    console.error('oops, package.json shouldn\'t be here')
    process.exit()
  } catch (e) {} // eslint-disable-line no-empty, do nothing, continue

  // npm init
  t.doesNotThrow(() => { child_process.execSync('npm init -f', { stdio: 'ignore' }) }, 'npm init -f')

  // install mwb
  t.doesNotThrow(() => { child_process.execSync('npm i -D ../../ --cache-min 999999999 ', { stdio: 'ignore' }) }, 'npm i -D ../../ ')

  // copy the initial package.json into memory
  const i = fs.readFileSync('package.json').toString()
  t.deepEqual(fs.readdirSync('tool'), ['build.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')


  // install full
  t.doesNotThrow(() => { child_process.execSync('npm run mwb initFull', { stdio: 'ignore' }) })
  console.log('Initiation took', Date.now() - start, 'ms')

  // obtain the first package.*.json file
  const p = fs.readdirSync('.').filter(f => /^package\..+\.json$/.test(f))[0]
  t.equal(fs.readFileSync(p).toString(), i, 'The previous package.json should have been copied')

  t.end()
})

tape('Modifying package.json', t => {
  // can't just use require('package.json')
  const p = require(path.resolve('package.json')) // eslint-disable-line

  t.ok(
    p.scripts.test &&
    p.scripts.mwb &&
    p.scripts.serve &&
    p.scripts.build &&
    p.scripts.bundle &&
    p.scripts.clean &&
    p.scripts.start &&
    p.devDependencies.mwb,
    'Should have all the scrips')

  t.ok(clv(p.dependencies, 'express') &&
       clv(p.dependencies, 'compression') &&
       clv(p.dependencies, 'mongodb') &&
       clv(p.dependencies, 'react') &&
       clv(p.dependencies, 'react-dom') &&
       clv(p.dependencies, 'redux') &&
       clv(p.dependencies, 'page')
       , 'Should have all the latest devDeps')

  t.end()

  // function to Check Latest Version
  function clv(dep, pack) {
    return dep[pack].substr(1) === child_process.execSync(`npm v ${pack} version`).toString().replace('\n', '')
  }
})

tape('Directory structure', t => {
  let dir = fs.readdirSync('.')
  t.ok(dir.indexOf('db') > -1 &&
    dir.indexOf('node_modules') > -1 &&
    dir.indexOf('src') > -1 &&
    dir.indexOf('test') > -1 &&
    dir.indexOf('tool') > -1
    , 'should have correct base directory structure')

  dir = fs.readdirSync('src')
  t.ok(dir.indexOf('client') > -1 &&
    dir.indexOf('server') > -1 &&
    dir.indexOf('share') > -1 &&
    dir.indexOf('public') > -1
    , 'should have correct src directory structure')

  dir = fs.readdirSync('src/client')
  t.ok(dir.indexOf('entry.js') > -1 &&
    dir.indexOf('entry.test.js') > -1 &&
    dir.indexOf('main.js') > -1
    , 'should have correct src/client directory structure')

  dir = fs.readdirSync('src/server')
  t.ok(dir.indexOf('entry.js') > -1 &&
    dir.indexOf('entry.test.js') > -1 &&
    dir.indexOf('main.js') > -1 &&
    dir.indexOf('app.js') > -1 &&
    dir.indexOf('mongo.js') > -1
    , 'should have correct src/server directory structure')

  dir = fs.readdirSync('src/share')
  t.ok(dir.indexOf('actions') > -1 &&
    dir.indexOf('components') > -1 &&
    dir.indexOf('reducers') > -1 &&
    dir.indexOf('html.js') > -1 &&
    dir.indexOf('index.html') > -1 &&
    dir.indexOf('initialState.js') > -1 &&
    dir.indexOf('routes.js') > -1
    , 'should have correct src/share directory structure')

  dir = fs.readdirSync('tool')
  t.deepEqual(dir, ['build.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')

  t.end()
})


tape('Server should response with hello world', { timeout: 60000 }, t => { // longer time out becos the serve may take a while to launch
  t.plan(3)
  // mocking stuff
  fs.writeFileSync('src/share/reducers/index.js', 'export default (state, action) => state')
  fs.writeFileSync('src/share/routes.js', "import React from 'react'\nexport default {['/'](store) {return () => <div>Hello world</div>}}")
  const dev = child_process.spawn('npm run dev', { cwd: process.cwd(), shell: true })
  dev.stdout.on('data', data => {
    if (/Express app listening at/.test(data)) {
      require('http').request('http://localhost:3000', res => { // eslint-disable-line global-require
        console.log(res.statusCode)
        let body = ''
        res.on('data', chunk => {
          body += chunk
        })
        res.on('end', () => {
          t.ok(/Hello world/.test(body), 'server responsed with "Hello World"')
          t.ok(/<script src="\/client.js"><\/script>/.test(body), 'and a script tag')
          t.ok(fs.statSync('build/public/client.js') &&
            fs.statSync('build/server/server.js') &&
            fs.statSync('build/webpack-assets.json')
            , 'should have correct base directory structure and files')
          dev.kill()
          t.end()
        })
      }).end()
    }
  })
})

/*
tape('Rerun npm i ../../ -D', t => {
  t.plan(4)
  const randomContent = 'Some dummy random content' + Math.random()
  fs.writeFileSync('tool/dummyfile.txt', randomContent)

  const oldCat = child_process.execSync('cat tool/*').toString()

  t.doesNotThrow(() => { child_process.execSync('npm i -D ../../ --cache-min 999999999', { stdio: 'ignore' }) }, 'rerun npm i -D ../../')

  process.chdir(fs.readdirSync('.').filter(d => /^tool_backup_/.test(d)).sort().reverse()[0]) // eslint-disable-line newline-per-chained-call
  const newCat = child_process.execSync('cat *').toString()
  console.log('the dir', process.cwd(), oldCat.length, newCat.length)
  // console.log()
  t.ok(new RegExp(randomContent).test(newCat), 'should have some dummy content')
  t.equal(newCat, oldCat, 'and same as the old tool directory')

  // may have problem with permission create directory tool in mwb.js
  process.chdir('..')
  t.deepEqual(fs.readdirSync('tool'), ['build.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')

  t.end()
  // process.exit()
})*/

/*tape('Run build', t => {
  child_process.execSync('npm ')
})*/
