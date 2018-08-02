/* import stuff */
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const { fork, spawn } = require('child_process')
const exec = promisify(require('child_process').exec)

const mkdirp = promisify(require('mkdirp'))
const { get } = require('axios')

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const appendFile = promisify(fs.appendFile)
const symlink = promisify(fs.symlink)


const test = require('tape')


/* ** top level variables ** */
const testTmpFolder = 'tmp'
const configFile = 'mwb.js'

/* ** start the tests ** */
!(async function () {
  const ts = Date.now()

  process.chdir(__dirname)
  console.log('__dirname', __dirname)
  console.log('path.resolve', path.resolve('.'))

  await prepare()

  process.chdir(testTmpFolder)
  console.log('path.resolve', path.resolve('.'))
  console.log('\n### All set up done ###\n')

  test('init dirs & files', test_init)

  test('Coyping stuff, not really a test', async t => {
    await exec(`cp -rf ..${path.sep}resources${path.sep}. src`)
    t.end()
  })

  test('wrong mode', test_wrong_mode)
  test('production mode', test_production_mode)
  test('dev mode', test_dev_mode)
  test('dev mode with TEST', test_dev_mode_TEST)

  test('end', t => {
    t.end()
    t.comment(`Total time taken: ${(Date.now() - ts) / 1000} s`)
    // usually take 50 ~ 60 sec
  })
}())

async function prepare() {
  await exec(`rm -rf ${testTmpFolder}`)
  await mkdirp(testTmpFolder)
  await Promise.all([
    symlink(`../../${configFile}`, `./${testTmpFolder}/${configFile}`, 'file'),
    symlink('../../node_modules', `./${testTmpFolder}/node_modules`, 'dir'),
    symlink('../../package.json', `./${testTmpFolder}/package.json`, 'file'),
  ])
}

async function test_init(t) {
  t.plan(5)

  console.log(1, 'run node ' + configFile + ' --init')
  await exec('node ' + configFile + ' --init') // init folders

  console.log(2, `run node ${configFile} --mode production`)
  await exec(`node ${configFile} --mode production`) // then build

  const files = {
    public: await readdir('./dist/public'),
    server: await readdir('./dist/server')
  }

  files.public.jsFiles = files.public.filter(i => /_[0-9a-f]{7}\.js$/.test(i))
  t.ok(files.public.includes('index.html'), 'Public dir has index.html')
  t.ok(files.public.jsFiles.length > 0, 'Public dir has js file')
  t.ok(files.server[0] === 'server.js', 'Server has a server.js')

  const server = fork('./dist/server/server.js', { silent: true })
  const response = (await getRetry('http://localhost:3000')()).data
  const expectedHtml = (await readFile('./dist/public/index.html')).toString()

  t.equal(response, expectedHtml, 'Server reponds with the correct html')
  t.ok(expectedHtml.includes(files.public.jsFiles[0]), 'The index.html has the correct script tag for js: ' + files.public.jsFiles[0])

  server.kill()
  t.end()
}

async function test_wrong_mode(t) {
  t.plan(1)

  await exec(`node ${configFile} --mode Production`).catch(e => { // production not Production
    t.ok(/The provided mode: 'Production' is not correct/.test(e.message), 'Need to supply --mode either production | development')
  })
  t.end()
}

async function test_production_mode(t) {
  t.plan(14)

  // build the server and client bundle
  await exec(`node ${configFile} --mode production`)
  console.log('done', path.resolve())
  // read the dir for correct dir structure and file
  const files = {
    public: await readdir('./dist/public'),
    server: await readdir('./dist/server')
  }
  files.public.jsFiles = files.public.filter(i => /_[0-9a-f]{7}\.js$/.test(i))

  t.ok(files.public.jsFiles.length > 1, 'Public dir has more than 2 js files and with correct suffix')
  t.ok(['bird2_3ZQz8.jpg', 'favicon.ico', 'index.html'].every(e => files.public.includes(e)), 'Public dir has html, ico and style and assets')
  t.deepEqual(files.server, ['1.server.js', '1.server.js.map', 'server.js', 'server.js.map'], 'Server dir has 4 files: 1.server.js, 1.server.js.map, server.js, server.js.map, no css')

  {
    const htmlString = (await readFile('./dist/public/index.html')).toString()
    const cssFile = files.public.filter(i => /^0\.style_[-\w]{7}\.css$/.test(i))[0]
    const cssString = (await readFile('./dist/public/' + cssFile)).toString()
    const jsFile = files.public.filter(i => /^client_/.test(i))[0]

    t.ok(htmlString.includes('src="/' + jsFile), 'Html has client js: ' + jsFile)
    t.ok(htmlString.includes('href="/' + cssFile), 'Html has client js: ' + cssFile)
    t.ok(cssString.includes('background-image:url(/bird2_3ZQz8.jpg)'), `CSS file ${cssFile}: url loader emits file`)
    t.ok(cssString.includes('url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACA'), 'CSS file, url rule produces base64')
    t.ok(cssString.includes('.style{color:#ffdab9}'), 'CSS file, minimisation is applied')
    t.ok(cssString.includes('.test_kUgW9{color:#ffefd5}'), 'CSS file, css module is applied')
    t.ok(cssString.includes('::-webkit-input-placeholder{'), 'CSS file, autoprefix is applied')
    t.ok(cssString.includes('.test1 .test2 .test3{color:#00f;color:var(--mainColor)}'), 'CSS file, nesting is applied, var is applied')
    t.ok(cssString.includes('body{background:green;background-color:#ff0;'), 'CSS file, merging css rules')
    // t.ok(cssString.includes('/*! normalize.css'), 'CSS file, merging css rules') // not working yet
  }
  // change a file and restart the building process
  await appendFile('./src/client/3.js', '\nconsole.log(1)\n')
  await exec('rm -rf ./dist')
  await exec(`node ${configFile} --mode production`)

  // // start the sever
  const server = fork('./dist/server/server.js', { silent: true })

  const newFiles = {
    public: await readdir('./dist/public'),
  }
  newFiles.public.jsFiles = newFiles.public.filter(i => /_[0-9a-f]{7}\.js$/.test(i))

  // should expect js files changed
  const diff = require('lodash').difference(files.public.jsFiles, newFiles.public.jsFiles)
  t.ok(diff.length > 0 && diff.length < files.public.length, 'Js files changed after edition')

  // now test server can repond to http get request
  const response = (await getRetry('http://localhost:3000')()).data
  const expectedHtml = (await readFile('./dist/public/index.html')).toString()
  t.equal(response, expectedHtml, 'Server reponds with the correct html')

  server.kill() // clean up

  t.end()
}

async function test_dev_mode(t) {
  t.plan(9)

  // clean up the dist dir
  await exec('rm -rf ./dist')

  // then spawn a node process
  let child = spawn('node', [configFile, '--mode', 'development'])

  // repeatedly prob to see if the server is ready, normally takes ~5 seconds
  await getRetry('http://localhost:3000')()

  const files = {
    public: await readdir('./dist/public'),
    server: await readdir('./dist/server')
  }

  t.ok(['0.client.js', '1.client.js', 'bird2_3ZQz8.jpg', 'client.js', 'favicon.ico', 'index.html'].every(e => files.public.includes(e)), 'Public dir has js, html, ico and assets')
  t.ok(files.public.filter(d => /\.css$/.test(d)).length === 0, 'Client dir has no css files')
  t.deepEqual(files.server, ['0.server.js', 'server.js'], 'Sever dir has only 0.server.js & server.js ')

  {
    const jsFileString = (await readFile('./dist/public/client.js')).toString()
    t.ok(jsFileString.indexOf('.style { color: PeachPuff') > 0, 'Client.js contains unminimised css without module renamed')
    t.ok(jsFileString.indexOf('.test_kUgW9 { color: Papaya') > 0, 'Client.js also contains unminimised css module')

    const response = (await getRetry('http://localhost:3000')()).data
    const expectedHtml = (await readFile('./dist/public/index.html')).toString()
    t.equal(response, expectedHtml, 'Server reponds with correct the html')
  }

  // change a file
  await Promise.all([
    appendFile('./src/client/3.js', '\nconsole.log(33)\n'),
    appendFile('./src/server/3.js', '\nconsole.log(11)\n'),
  ])

  await retryFunction(async () => (await readdir('./dist/public')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2)()
  t.pass('HMR applied for client')
  t.ok((await readdir('./dist/server')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length === 0, 'but not for server')
  child.kill()

  // with --hot.server
  child = spawn('node', [configFile, '--mode', 'development', '--hot.server'])
  await getRetry('http://localhost:3000')()

  // change a file
  await appendFile('./src/server/3.js', '\nconsole.log(1)\n')
  await retryFunction(async () => (await readdir('./dist/server')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2)()

  t.pass('HMR applied for server with --hot.server on')
  child.kill()

  t.end()
}


async function test_dev_mode_TEST(t) {
  t.plan(5)

  // clean up the dist dir
  await exec('rm -rf ./dist')

  // then spawn a node process
  const child = spawn('node', [configFile, '--mode', 'development', '--env.TEST', '--env.TEST_CIN'])

  await sleep(5000)

  const files = {
    public: await readdir('./dist/public'),
    server: await readdir('./dist/server')
  }

  t.deepEqual(files.public, ['client.test.js', 'favicon.ico', 'index.html'], 'Public dir has all the correct files')
  t.deepEqual(files.server, ['node.test.js', 'server.test.js'], 'Server dir also has all the correct files')

  await Promise.all([
    appendFile('./src/client/entry.test.js', '\nconsole.log(1)\n'),
    appendFile('./src/client/entry.node.test.js', '\nconsole.log("NNNNNN")\n'),
    appendFile('./src/server/entry.test.js', '\nconsole.log("SSSSSS")\n'),
  ])

  await sleep(2500)

  t.ok((await readdir('./dist/public')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2, 'HMR applied for client during test')
  t.ok((await readFile('./dist/server/node.test.js')).toString().includes('NNNNNN'), 'Client entry.node.test.js got updated')
  t.ok((await readFile('./dist/server/server.test.js')).toString().includes('SSSSSS'), 'Server entry.test.js got updated as well')

  child.kill()

  t.end()
}

function getRetry(...arg) {
  return async function (nRetry = 10, interval = 1000) {
    let result = await get(...arg).catch(e => e)
    while (result instanceof Error && nRetry-- > 0) {
      result = await new Promise(res => { // eslint-disable-line no-await-in-loop
        setTimeout(() => {
          res(get(...arg).catch(e => e))
        }, interval)
      })
    }
    return result instanceof Error ? Promise.reject(result) : result
  }
}

async function sleep(duration = 1000) {
  await new Promise(res => setTimeout(res, duration))
}


function retryFunction(fn) {
  return async function (nRetry = 10, interval = 1000) {
    let result = await fn()
    while (!result && nRetry-- > 0) {
      result = await new Promise(res => { // eslint-disable-line no-await-in-loop
        setTimeout(() => {
          res(fn())
        }, interval)
      })
    }

    return result || Promise.reject(new Error('No result'))
  }
}
