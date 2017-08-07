const path = require('path')
const fs = require('fs')
const { execSync, exec } = require('child_process')

const test = require('tape')

const start = Date.now()

process.chdir(__dirname)

execSync('rm -rf build/* && mkdir build')

process.chdir('build')

test('should install ok', t => {
  // safe guard
  try {
    fs.statSync('package.json') // this file shouldn't exist
    console.error('oops, package.json shouldn\'t be here ')
    process.exit()
  } catch (e) {} // eslint-disable-line no-empty

  // npm init
  t.doesNotThrow(() => { execSync('npm init -f', { stdio: 'ignore' }) }, 'npm init -f')

  // install mwb
  t.doesNotThrow(() => { execSync('npm i -D ../../ ', { stdio: 'ignore' }) }, 'npm i -D ../../ ')

  // copy the initial package.json into memory
  const i = fs.readFileSync('package.json').toString()
  t.deepEqual(fs.readdirSync('tool'), ['build.js', 'common.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')


  // install full
  t.doesNotThrow(() => { execSync('npm run mwb initFull', { stdio: 'ignore' }) })
  console.log('Initiation took', Date.now() - start, 'ms')

  // obtain the first package.*.json file
  const p = fs.readdirSync('.').find(f => /^package\..+\.json$/.test(f))
  t.equal(fs.readFileSync(p).toString(), i, 'The previous package.json should have been copied')

  // copy these now because touching files will trigger watch in webpack in later test
  execSync("echo console.log('BROWSER TEST MODE') > ./src/client/entry.test.js")
  execSync("echo console.log('NODE TEST MODE') > ./src/client/entry.node.test.js")
  execSync("echo console.log('SERVER TEST MODE') > ./src/server/entry.test.js")
  execSync("echo console.log('public stuff') > ./src/public/public.js")


  t.end()
})

test('Modifying package.json', t => {
  // can't just use require('package.json')
  const p = require(path.resolve('package.json'))

  t.ok(
    p.scripts.test
    && p.scripts.mwb
    && p.scripts.serve
    && p.scripts.build
    && p.scripts.bundle
    && p.scripts.clean
    && p.scripts.start
    && p.devDependencies.mwb,
    'Should have all the scripts'
  )

  t.ok(
    clv(p.dependencies, 'express')
    && clv(p.dependencies, 'compression')
    && clv(p.dependencies, 'mongodb')
    && clv(p.dependencies, 'react')
    && clv(p.dependencies, 'react-dom')
    && clv(p.dependencies, 'redux')
    && clv(p.dependencies, 'page'),
    'Should have all the latest devDeps'
  )

  t.end()

  // function to Check Latest Version
  function clv(dep, pack) {
    return dep[pack].substr(1) === execSync(`npm v ${pack} version`).toString().replace('\n', '')
  }
})

test('Directory structure', t => {
  let dir = fs.readdirSync('.')
  t.ok(
    dir.indexOf('db') > -1
    && dir.indexOf('node_modules') > -1
    && dir.indexOf('src') > -1
    && dir.indexOf('test') > -1
    && dir.indexOf('tool') > -1,
    'should have correct base directory structure'
  )

  dir = fs.readdirSync('src')
  t.ok(
    dir.indexOf('client') > -1
    && dir.indexOf('server') > -1
    && dir.indexOf('share') > -1
    && dir.indexOf('public') > -1,
    'should have correct src directory structure'
  )

  dir = fs.readdirSync('src/client')
  t.ok(
    dir.indexOf('entry.js') > -1
    && dir.indexOf('entry.test.js') > -1
    && dir.indexOf('main.js') > -1,
    'should have correct src/client directory structure'
  )

  dir = fs.readdirSync('src/server')
  t.ok(
    dir.indexOf('entry.js') > -1
    && dir.indexOf('entry.test.js') > -1
    && dir.indexOf('main.js') > -1
    && dir.indexOf('app.js') > -1
    && dir.indexOf('mongo.js') > -1,
    'should have correct src/server directory structure'
  )

  dir = fs.readdirSync('src/share')
  t.ok(
    dir.indexOf('actions') > -1
    && dir.indexOf('components') > -1
    && dir.indexOf('reducers') > -1
    && dir.indexOf('html.js') > -1
    && dir.indexOf('index.html') > -1
    && dir.indexOf('initialState.js') > -1
    && dir.indexOf('routes.js') > -1,
    'should have correct src/share directory structure'
  )

  dir = fs.readdirSync('tool')
  t.deepEqual(dir, ['build.js', 'common.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')

  t.end()
})


test('Server should respond with hello world', { timeout: 100000 }, t => { // longer time out becos the serve may take a while to launch
  t.plan(3)
  // mocking stuff
  fs.writeFileSync('src/share/reducers/index.js', 'export default (state, action) => state')
  fs.writeFileSync('src/share/routes.js', "import React from 'react'\nexport default {['/'](store) {return () => <div>Hello world</div>}}")
  const dev = exec('npm run dev', { cwd: process.cwd() })
  dev.stderr.on('data', data => {
    console.log('Error', data.toString())
  })
  dev.stdout.on('data', data => {
    if (/Express app listening at/.test(data.toString())) {
      fs.unlinkSync('build/public/index.html') // delete the client index.html temporarily, this is generated by HTML plugin, we want to use the react renderToString on server
      require('http').request('http://localhost:3000', res => {
        console.log(res.statusCode)
        let body = ''
        res.on('data', chunk => {
          body += chunk.toString()
        })
        res.on('end', () => {
          t.ok(/Hello world/.test(body), 'server responded with "Hello World"')
          t.ok(/<script src="\/client.js"><\/script>/.test(body), 'and a script tag')
          t.ok(
            fs.statSync('build/public/client.js')
            && fs.statSync('build/server/server.js')
            && fs.statSync('build/webpack-assets.json'),
            'should have correct base directory structure and files'
          )
          dev.kill()

          t.end()
        })
      }).end()
    }
  })
})


test('MWB in test mode', t => {
  t.plan(6)
  const dev = exec('node tool/test')
  let n = 0
  dev.stdout.on('data', data => {
    if (/Client bundles for browser/.test(data.toString())) t.pass('TEST build for client in browser ' + n++)
    if (/Client bundles for node/.test(data.toString())) t.pass('TEST build for client in node ' + n++)
    if (/Server bundles for node/.test(data.toString())) t.pass('TEST build for server ' + n++)
    if (/SERVER TEST MODE/.test(data.toString())) t.pass('SERVER TEST has been run ' + n++)
    if (/NODE TEST MODE/.test(data.toString())) t.pass('CLIENT NODE TEST has been run ' + n++)
    if (n === 5) {
      dev.kill()
      fs.statSync('./test/build/public/client.test.js')
      fs.statSync('./test/build/node/node.test.js')
      fs.statSync('./test/build/server/server.test.js')
      t.pass('Test files created')
      t.end()
    }
  })
})

test('MWB in build mode', t => {
  t.plan(1)
  execSync('rm -rf ./build/*')
  execSync('npm run build')
  fs.statSync('./build/webpack-assets.json')
  fs.statSync('./build/public/index.html')
  fs.statSync('./build/server/server.js')
  t.pass('Build files created')
  t.end()
})


test.skip('Extending MWB config in dev mode', t => {
  t.plan(5)
  const content = `
function alterClient(config, env) {
  console.log(config, 'ENV CLIENT', env)
  if (env === 'dev') config.output.path = require('path').resolve('./build/public2')
  if (env === 'test') config.output.path = require('path').resolve('./test/build/public3')
  if (env === 'testInNode') config.output.path = require('path').resolve('./test/build/node3')
  if (env === 'build') config.output.path = require('path').resolve('./build/public4')

  return function() {
    console.log('alterClient cb done')
  }
}

function alterServer(config, env) {
  console.log(config, 'ENV SERVER', env)
  if (env === 'dev') config.output.path = require('path').resolve('./build/server2')
  if (env === 'test') config.output.path = require('path').resolve('./test/build/server3')
  if (env === 'build') config.output.path = require('path').resolve('./build/server4')

  return function() {
    console.log('alterServer cb done')
  } 
}

function alterCordova(config, env) {}

function noop() {}

module.exports = {
  alterClient,
  alterServer,
  alterCordova,
}
  `
  fs.writeFileSync('mwb.config.js', content)
  const dev = exec('npm run dev', { cwd: process.cwd() })
  dev.stdout.on('data', data => {
    if (/'ENV CLIENT' 'dev'/.test(data.toString())) t.pass('ENV is passed into alterClient')
    if (/'ENV SERVER' 'dev'/.test(data.toString())) t.pass('ENV is passed into alterServer')
    if (/alterClient cb done/.test(data.toString())) t.pass('cb returned by alterClient is executed')
    if (/alterServer cb done/.test(data.toString())) t.pass('cb returned by alterServer is executed')
    if (/Express app listening/.test(data.toString())) {
      dev.kill()
      fs.statSync('build/public2/index.html')
      fs.statSync('build/public2/client.js')
      fs.statSync('build/public2/public.js')
      fs.statSync('build/server2/server.js')
      t.pass('Configs for client & server can be altered during build mode')
      t.end()
    }
  })
})

test.skip('Extending MWB config in test mode', t => {
  t.plan(7)
  const dev = exec('npm test', { cwd: process.cwd() })
  let n = 0

  // dev.stderr.on('data', console.log)
  dev.stdout.on('data', data => {
    // if (/Client bundles for browser/.test(data.toString())) n++
    // if (/Client bundles for node/.test(data.toString())) n++
    // if (/Server bundles for node/.test(data.toString())) n++
    // if (/SERVER TEST MODE/.test(data.toString())) n++
    // if (/NODE TEST MODE/.test(data.toString())) n++

    if (/'ENV CLIENT' 'test'/.test(data.toString())) t.pass('ENV is passed into alterClient ' + n++)
    if (/'ENV CLIENT' 'testInNode'/.test(data.toString())) t.pass('ENV is passed into alterClient in node ' + n++)
    if (/'ENV SERVER' 'test'/.test(data.toString())) t.pass('ENV is passed into alterServer ' + n++)
    if (/alterClient cb done/.test(data.toString())) t.pass('cb returned by alterClient is executed ' + n++) // this is executed twice, once by client in brower, once by client in node
    if (/alterServer cb done/.test(data.toString())) t.pass('cb returned by alterServer is executed ' + n++)
    if (n === 6) {
      dev.stdout.removeAllListeners('data')
      dev.kill()
      fs.statSync('test/build/public3/client.test.js')
      fs.statSync('test/build/public3/public.js')
      fs.statSync('test/build/node3/node.test.js')
      fs.statSync('test/build/server3/server.test.js')
      t.pass('Configs for client & server can be altered during test mode')
      t.end()
    }
  })
})

test.skip('Extending MWB config in build mode', t => {
  t.plan(1)
  execSync('npm run build', { cwd: process.cwd() })
  fs.statSync('./build/webpack-assets.json')
  fs.statSync('./build/public4/index.html')
  fs.statSync('./build/public4/public.js')
  fs.statSync('./build/server4/server.js')
  t.pass('Configs for client & server can be altered during build mode')
  t.end()
})


test('Rerun npm i ../../ -D', t => {
  t.plan(4)
  const randomContent = 'Some dummy random content' + Math.random()
  fs.writeFileSync('tool/dummyfile.txt', randomContent)

  const oldCat = execSync('cat tool/*').toString()

  t.doesNotThrow(() => { execSync('npm i -D ../../', { stdio: 'ignore' }) }, 'rerun npm i -D ../../')

  process.chdir(fs.readdirSync('.').filter(d => /^tool_backup_/.test(d)).sort().reverse()[0]) // eslint-disable-line newline-per-chained-call
  const newCat = execSync('cat *').toString()
  // console.log('the dir', process.cwd(), oldCat.length, newCat.length)

  t.ok(new RegExp(randomContent).test(newCat), 'should have some dummy content')
  t.equal(newCat, oldCat, 'and same as the old tool directory')

  // may have problem with permission create directory tool in mwb.js
  process.chdir('..')
  t.deepEqual(fs.readdirSync('tool'), ['build.js', 'common.js', 'dev.js', 'log-apply-result.js', 'signal.js', 'test.js', 'webpack.config.js', 'webpack.config.test.js'], 'should have correct tool directory structure')

  t.end()
  process.exit()
})
