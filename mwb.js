/* This is a template for building client and server with HMR */

const htmlWebpackPluginOption = {
  title: 'My Awesome App',
  template: './src/client/index.html',
}

/* ***** ONLY CHANGE AFTER THIS IF YOU KNOW WHAT YOU ARE DOIG ***** */

/* import stuff */
const path = require('path')
const execSync = require('child_process')
const webpack = require('webpack')
const argv = require('minimist')(process.argv.slice(2))

if (argv.init) { init(); process.exit() }
if (!argv.mode) argv.mode = 'development'
if (!['production', 'development'].includes(argv.mode)) throw new Error(`The provided mode: '${argv.mode}' is not correct`)

process.env.NODE_ENV = argv.mode // has to set this for babel-preset-react-app to work
argv.env = argv.env || {}
Object.keys(argv.env).forEach(e => { process.env[e] = argv.env[e] })

const clientConfig = makeConfig('client', argv) // ; console.log('CCC', clientConfig)
const serverConfig = makeConfig('server', argv) // ; console.log('SSS', serverConfig)

if (argv.mode === 'production') {
  require('child_process').execSync('rm -rf dist') // remove the dist folder

  // Don't try to optimize prematurely. The defaults are choosen to fit best practices of web performance.
  clientConfig.optimization = {
    // splitChunks: { chunks: 'all' },
    // splitChunks: { cacheGroups: { vendors: { chunks: 'all' } } },
    // runtimeChunk: true // generate another file so the entry chunk file will has the same hash if
  }
  // chunks: all, dafault is async, https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693
  // when all, even vendor chunks are moved out from the entry chunk

  webpack(clientConfig).run((err, stats) => {
    if (err) throw err
    logStats(stats, 'client')
  })
  webpack(serverConfig).run((err, stats) => {
    if (err) throw err
    logStats(stats, 'server')
  })
} else if (argv.mode === 'development') {
  compile_web_devMode(clientConfig, argv)
  compile_node_devMode(serverConfig, argv)

  // For client tests to run in node env
  if (argv.env.TEST) {
    const clientConfigNode = makeConfig('server', argv)
    clientConfigNode.entry.server = ['./src/client/entry.node.test.js']
    clientConfigNode.output.filename = 'node.test.js'

    compile_node_devMode(clientConfigNode, argv)
  }
}

copyPublicStuff()

// helper functions
function makeConfig(target = 'client', args) {
  if (!['client', 'server'].includes(target)) throw new Error(`The provided target: '${target}' is not correct`)
  const { mode, env } = args
  const isTEST = mode === 'production' ? false : env.TEST

  const common = {
    resolve: {
      alias: { '~': path.resolve('./src') }
    },
    module: { rules: makeRules(target, args) },
    plugins: makePlugins(target, args),
    mode,
  }

  if (mode !== 'production') {
    common.performance = { hints: false }
    common.devtool = 'cheap-module-eval-source-map'
  }

  const entryFilename = isTEST ? 'entry.test.js' : 'entry.js'

  if (target === 'client') return {
    ...common,
    entry: {
      client: ['./src/client/' + entryFilename],
    },
    output: {
      filename: mode === 'production' ? '[name]_[chunkhash:7].js' : (isTEST ? 'client.test.js' : 'client.js'),
      path: path.resolve('./dist/public/'),
      publicPath: '/',
    }
  }

  if (target === 'server') return {
    ...common,
    entry: {
      server: ['./src/server/' + entryFilename],
    },
    target: 'node',
    output: {
      filename: isTEST ? 'server.test.js' : 'server.js',
      path: path.resolve('./dist/server/'),
      libraryTarget: 'commonjs2', // src: const express = require('express') -> webpack builds: const express = require('express'); otherwise webpack builds: const express = express, which is wrong
    },
    externals: [
      /^[@a-z][a-z/.\-0-9]*$/i, // native modules will be excluded, e.g require('react/server')
      /^.+assets\.json$/i, // these assets produced by assets-webpack-plugin
    ]
  }
}

function makeRules(target = 'client', args) {
  const rules = [{
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      query: {
        presets: [
          ['env', {
            target: target === 'client'
              ? { browsers: ['last 2 versions', '> 5%'] }
              : { node: true },
            useBuiltIns: true,
          }],
          'react-app',
          'stage-0',
        ],
        cacheDirectory: true, // cache into OS temp folder by default
      }
    }],
  }, {
    test: /\.sql$/,
    // exclude: /node_modules/,
    use: ['raw-loader'],
  }, {
    test: /\.(?!(jsx?|json|s?css|less|html?|sql)$)([^.]+$)/, // match everything except js, jsx, json, css, scss, less. You can add more
    // exclude: /node_modules/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: 8192,
        name: '[name]_[hash:base64:5].[ext]',
        emitFile: target === 'client',
      }
    }],
  }, makeCSSRule(target, args, false), makeCSSRule(target, args, true)
  ]

  return rules
}

function makeCSSRule(target = 'client', { mode }, useCSSModule = false) {
  const ExtractTextPlugin = require('extract-text-webpack-plugin')

  const cssLoader = {
    loader: 'css-loader' + (target === 'client' ? '' : '/locals'), // /locals doesn't embed css, only exports the identifier mappings
    options: {
      modules: useCSSModule,
      localIdentName: '[local]_[hash:base64:5]',
      minimize: mode === 'development' ? false : { discardComments: { removeAll: true } },
    }
  }
  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      plugins: () => [require('postcss-import')(), require('postcss-cssnext')()]
    }
  }
  const loader = {
    test: useCSSModule ? /\.local\.css$/i : /^((?!\.local).)*css$/i,
    use: mode === 'development'
      ? [{ loader: 'style-loader' }, cssLoader, postcssLoader]
      : ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [cssLoader, postcssLoader]
      })
  }

  if (target === 'server') loader.use = useCSSModule ? [cssLoader, postcssLoader] : [{ loader: 'null-loader' }]

  return loader
}

function makePlugins(target = 'client', { mode }) {
  const ExtractTextPlugin = require('extract-text-webpack-plugin')

  const plugins = [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode) }),
    new webpack.DefinePlugin({ 'process.env.APP_ENV': JSON.stringify(target) }),
  ]

  if (target === 'client') {
    plugins.push(new (require('html-webpack-plugin'))(htmlWebpackPluginOption))
    if (mode === 'production') plugins.push(new ExtractTextPlugin({ filename: 'style_[contenthash:base64:5].css', allChunks: false }))
  }

  return plugins
}

function compile_web_devMode(config, args) {
  const port = 9090
  config.entry.client.push('webpack-hot-middleware/client?path=http://' + getIp() + ':' + port + '/__webpack_hmr&overlay=false&reload=true&noInfo=true&quiet=true')
  config.plugins.push(new webpack.HotModuleReplacementPlugin())

  const compiler = webpack(config)

  require('http').createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    require('webpack-hot-middleware')(compiler, { log: false })(req, res)
  }).listen(port)

  compiler.watch({}, (err, stats) => {
    if (err) throw err
    logStats(stats, 'client')
  })
}

function compile_node_devMode(config, args) {
  const isHot = args.hot && args.hot.server
  if (isHot) {
    // this line below affect test/test.js
    config.entry.server.push(path.resolve('./node_modules/webpack/hot/signal.js?message')) // use message instead of SIGUSR2 as SIGUSR2 is not implemented in windows
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
  }

  let child
  webpack(config).watch({}, (err, stats) => {
    if (err) throw err
    logStats(stats, 'server')

    child
      ? isHot ? child.send({}) : child.kill() // can't use child.kill('SIGUSR2') as 'SIGUSR2' is not implemented in windows, so use child.send({}) for HMR
      : forkChild()
  })

  function forkChild() {
    child = require('child_process').fork(path.join(config.output.path, config.output.filename))
    const start = Date.now()
    child.on('exit', (code, signal) => {
      console.error('Child server exited with code:', code, 'and signal:', signal)
      child = null
      if (code === 0) return
      if (Date.now() - start > 1000) forkChild() // arbitrarily only after the server has started for more than 1 sec
    })
  }
}

async function copyPublicStuff() {
  const { promisify } = require('util')
  const mkdirp = promisify(require('mkdirp'))

  const publicPath = path.resolve('./src/public/')

  await mkdirp(publicPath)
  await mkdirp(clientConfig.output.path)
  promisify(require('child_process').exec)(`cp -rf "${publicPath}${path.sep}." "${clientConfig.output.path}"`).catch(console.error)
}

function logStats(stats, target) {
  const statString = stats.toString({ colors: true })
  console.log(`${target} Bundle\n${statString}\n`)
}

function getIp() {
  const interfaces = require('os').networkInterfaces()
  const addresses = []
  for (const k in interfaces) {
    for (const k2 in interfaces[k]) {
      const address = interfaces[k][k2]
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address)
      }
    }
  }
  return addresses[1]
}

function init() {
  const mkdirp = require('mkdirp')
  const { appendFileSync, writeFileSync } = require('fs')
  const { execSync } = require('child_process')

  ;['./src/client', './src/server', './src/public'].forEach(d => mkdirp.sync(d))
  ;['./src/client/entry.js',
    './src/client/entry.test.js',
    './src/client/entry.node.test.js',
    './src/server/entry.test.js',
  ].forEach(d => appendFileSync(d, ''))

  try {
    const data = `<!DOCTYPE html>
  <html>  
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title></title>
    <meta name="description" content="" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta http-equiv="cleartype" content="on" />
  </head>
  <body>
    <div id="root"></div>
  </body>
  </html>`
    writeFileSync('./src/client/index.html', data, { flag: 'wx' })
  } catch (e) {}

  try {
    const data = `import express from 'express'
const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 'loopback')

app.use(express.static('./dist/public'))

app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile('index.html', { root: './dist/public' }, e => e && next())
  } else next()
})

app.listen(process.env.PORT || 3000, process.env.HOST, function () {
  console.log(\`************************************************************
Listening at http://$\{this.address().address}:$\{this.address().port}
NODE_ENV: $\{process.env.NODE_ENV}
process.pid: $\{process.pid}
root: $\{require('path').resolve()}
'************************************************************\`)
})

export default app`
    writeFileSync('./src/server/entry.js', data, { flag: 'wx' })
  } catch (e) {}

  console.log('\n\n\nsrc folders and files have been created\n\n')
  console.log(execSync('ls -lah ./src').toString() + '\n\n\n')

  // install devDep if needed
  const installedPackages = [].concat(
    Object.keys(require(path.resolve('./package.json')).devDependencies || ''),
    Object.keys(require(path.resolve('./package.json')).dependencies || '')
  )

  const packageToBeInstalled = [
    'babel-loader', 'file-loader', 'url-loader', 'raw-loader', 'null-loader',
    'style-loader', 'css-loader', 'postcss-loader', 'postcss-import', 'postcss-cssnext',
    'babel-preset-react-app', 'babel-preset-stage-0',
    'html-webpack-plugin', 'extract-text-webpack-plugin', 'offline-plugin',
    'webpack-hot-middleware',
    'eslint', 'babel-eslint',
  ].filter(d => !installedPackages.includes(d))

  if (packageToBeInstalled.length > 0) {
    console.log('Running npm i -D ' + packageToBeInstalled.join(' '))
    execSync('npm i -D ' + packageToBeInstalled.join(' '))
  }
}
