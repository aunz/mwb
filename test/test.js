/* import stuff */
const path = require('path')
const { promisify } = require('util')
const readdir = promisify(require('fs').readdir)
const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)
const exec = promisify(require('child_process').exec)
const { fork, spawn } = require('child_process')

const mkdirp = promisify(require('mkdirp'))
const { get } = require('axios')

const test = require('tape')


/*** top level variables ***/

const testFolder = 'tmp'
const configFile = 'mwb.js'


/*** start the tests ***/

const ts = Date.now()

!async function () {
  process.chdir(__dirname)
  console.log('__dirname', __dirname)
  console.log('path.resolve', path.resolve('.'))

  await prepare()

  process.chdir(testFolder)
  console.log('path.resolve', path.resolve('.'))
  console.log('\n### All set up done ###\n')

  test('no mode', test_no_mode)
  test('production mode', test_production_mode)
  test('dev mode', test_dev_mode)
  test('dev mode with TEST', test_dev_mode_TEST)

  test('end', t => {
    t.end()
    t.comment(`Total time taken: ${(Date.now() - ts) / 1000} s`)
    // usually take 35 ~ 40 sec
  })
}()

async function prepare() {
  await exec(`rm -rf ${testFolder}`)
  await mkdirp(`./${testFolder}/src`),
  await exec(`cp -rf resources${path.sep}. ${testFolder}${path.sep}src`)
  await exec(`cp ..${path.sep}${configFile} ${testFolder}`)

  // need to change the config file path
  const configPath = testFolder + '/' + configFile
  const configString = (await readFile(configPath)).toString()
    .replace('./node_modules/webpack/hot/signal.js?', '../.$&')
  
  await writeFile(configPath, configString)
}

async function test_no_mode(t) {
  t.plan(2)

  await exec('node ' + configFile).catch(e => {
    t.ok(/The provided mode: 'undefined' is not correct/.test(e.message), 'Need to supply --mode')
  })

  await exec(`node ${configFile} --mode Production`).catch(e => {
    t.ok(/The provided mode: 'Production' is not correct/.test(e.message), 'Need to supply --mode either production | development')
  })
  t.end()
}

async function test_production_mode(t) {
  t.plan(5)

  // build the server and client bundle
  await exec(`node ${configFile} --mode production`)

  // read the dir for correct dir structure and file
  const files = {
    public: await readdir('./dist/public'),
    server: await readdir('./dist/server')
  }
  files.public.jsFiles = files.public.filter(i => /_[0-9a-f]{7}\.js$/.test(i))

  t.ok(files.public.jsFiles.length > 1, 'Public dir has more than 2 js files and with correct suffix')
  t.ok(['bird2_3fedc67.jpg', 'favicon.ico', 'index.html', 'styles_5359e1a.css'].every(e => files.public.includes(e)), 'Public dir has html, ico and style and assets')
  t.deepEqual(files.server, ['0.server.js', 'server.js'], 'Server dir has 0.server.js & server.js ')

  // change a file and restart the building process
  await writeFile('./src/client/3.js', '\nconsole.log(1)\n', { flag: 'a' })
  await exec('rm -rf ./dist')
  await exec(`node ${configFile} --mode production`)

  // start the sever
  const server = fork('./dist/server/server.js', { silent: true })

  const newFiles = {
    public: await readdir('./dist/public'),
  }
  newFiles.public.jsFiles = newFiles.public.filter(i => /_[0-9a-f]{7}\.js$/.test(i))

  // should expect js files changed
  const diff = require('lodash').difference(files.public.jsFiles, newFiles.public.jsFiles)
  t.ok(diff.length > 0 && diff.length < files.public.length, 'Js files changed after edition')

  // now test server can repond to http get request
  const expectedHtml = (await readFile('./dist/public/index.html')).toString()
  const response = (await get('http://localhost:3000')).data
  t.ok(expectedHtml === response, 'Server reponds with the correct html')
 
  server.kill() // clean up 

  t.end()
}

async function test_dev_mode(t) {
  t.plan(6)

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
  
  t.ok(['0.client.js', '1.client.js', 'bird2_3fedc67.jpg', 'client.js', 'favicon.ico', 'index.html'].every(e => files.public.includes(e)), 'Public dir has js, html, ico and assets')
  t.deepEqual(files.server, ['0.server.js', 'server.js'], 'Sever dir has 0.server.js & server.js ')

  {
    const expectedHtml = (await readFile('./dist/public/index.html')).toString()
    const response = (await get('http://localhost:3000')).data
    t.ok(expectedHtml === response, 'Server reponds with correct the html')
  }
  
  // change a file 
  await writeFile('./src/client/3.js', '\nconsole.log(1)\n', { flag: 'a' })
  await writeFile('./src/server/3.js', '\nconsole.log(1)\n', { flag: 'a' })
  await sleep() // and wait for the rebuild

  t.ok((await readdir('./dist/public')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2, 'HMR applied for client')
  t.ok((await readdir('./dist/server')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length === 0, 'but not for server')

  // with --hot.server
  child.kill()
  child = spawn('node', [configFile, '--mode', 'development', '--hot.server'])

  // repeatedly prob to see if the server is ready, normally takes ~5 seconds
  await getRetry('http://localhost:3000')()

  // change a file 
  await writeFile('./src/server/3.js', '\nconsole.log(1)\n', { flag: 'a' })
  await sleep()

  child.kill()
  t.ok((await readdir('./dist/server')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2, 'HMR applied for server with --hot.server on')

  t.end()
}


async function test_dev_mode_TEST(t) {
  t.plan(5)

  // clean up the dist dir
  await exec('rm -rf ./dist')

  // then spawn a node process
  let child = spawn('node', [configFile, '--mode', 'development', '--env.TEST'])

  await sleep(5000)

  const files = {
    public: await readdir('./dist/test/public'),
    server: await readdir('./dist/test/server')
  }

  t.deepEqual(files.public, ['client.test.js', 'favicon.ico', 'index.html'], 'Public dir has all the correct files')
  t.deepEqual(files.server, ['node.test.js', 'server.test.js'], 'Server dir also has all the correct files')

  await writeFile('./src/client/entry.test.js', '\nconsole.log(1)\n', { flag: 'a' })
  await writeFile('./src/client/entry.node.test.js', '\nconsole.log(NNNNNN)\n', { flag: 'a' })
  await writeFile('./src/server/entry.test.js', '\nconsole.log(SSSSSS)\n', { flag: 'a' })

  await sleep(2500)

  t.ok((await readdir('./dist/test/public')).filter(d => /\.hot-update\.(js|json)$/.test(d)).length >= 2, 'HMR applied for client during test')  
  t.ok((await readFile('./dist/test/server/node.test.js')).toString().includes('NNNNNN'), 'Client entry.node.test.js got updated')
  t.ok((await readFile('./dist/test/server/server.test.js')).toString().includes('SSSSSS'), 'Server entry.test.js got updated as well')

  child.kill()

  t.end()
}

function getRetry(...arg) {
  return async function (nRetry = 10, interval = 1000) {
    let result = await get(...arg).catch(e => e)
    while (result instanceof Error && nRetry-- > 0) {
      result = await new Promise(res => {
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

