/* This is a template for building client and server with HMR */

/* import stuff */
const path = require('path')
const webpack = require('webpack')
const argv = require('minimist')(process.argv.slice(2))

if (argv.init) { init(); process.exit() }
if (!argv.mode) argv.mode = 'development'
if (!['production', 'development'].includes(argv.mode)) throw new Error(`The provided mode: '${argv.mode}' is not correct`)

argv.env = { ...(argv.env || {}), NODE_ENV: argv.mode }
Object.keys(argv.env).forEach(e => { process.env[e] = argv.env[e] })

const clientConfig = makeConfig('client', argv)
const serverConfig = makeConfig('server', argv)

if (argv.mode === 'production') {
  require('child_process').execSync('rm -rf dist')
  webpack(clientConfig).run(logStats)
  webpack(serverConfig).run(logStats)
} else if (argv.mode === 'development') {
  compile_web_devMode(clientConfig, argv)
  compile_node_devMode(serverConfig, argv)

  if (argv.env.TEST) { // For client tests to run in node env
    const clientConfigNode = makeConfig('server', argv)
    clientConfigNode.entry = { client_in_node: ['./src/client/entry.node.test.js'] }
    clientConfigNode.output.filename = 'node.test.js'

    // compile_node_devMode(clientConfigNode, argv)
  }
}

copyPublicStuff()

function makeConfig(target = 'client', args) {
  if (!['client', 'server'].includes(target)) throw new Error(`The provided target: '${target}' is not correct`)
  const { mode, env } = args
  const isTEST = mode === 'production' ? false : env.TEST

  const common = {
    resolve: {
      alias: { '~': path.resolve('./src') },
    },
    module: { rules: makeRules(target, args) },
    plugins: makePlugins(target, args),
    mode,
  }

  if (mode !== 'production') {
    common.performance = { hints: false }
    common.devtool = 'cheap-module-eval-source-map'
  } else {
    // common.devtool = 'nosources-source-map' 
  }

  const entryFilename = isTEST ? 'entry.test.js' : 'entry.js'

  if (target === 'client') return {
    ...common,
    entry: {
      client: ['./src/client/' + entryFilename],
    },
    target: 'web',
    output: {
      filename: mode === 'production' ? '[name]_[chunkhash:7].js' : (isTEST ? 'client.test.js' : 'client.js'),
      path: path.resolve('./dist/public/'),
      publicPath: '/',
    },
    // Don't try to optimize prematurely. The defaults are choosen to fit best practices of web performance. https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693
    // optimization: mode === 'development' ? {} : {
    //   splitChunks: { chunks: 'all' }, // when all, even vendor chunks are moved out from the entry chunk
    //   runtimeChunk: true // generate another file so the entry chunk file will has the same hash if
    // }
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
  const presets = [['@babel/preset-react']]
  target === 'client' && presets.push(['@babel/preset-env', {
    targets: {
      browsers: ['last 2 versions', '> 5%'],
    },
    useBuiltIns: 'usage',
    shippedProposals: true,
    modules: false,
  }])
  const babelRule = {
    test: /\.m?jsx?$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      query: {
        presets,
        cacheDirectory: true, // cache into OS temp folder by default
        retainLines: args.mode === 'development',
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-syntax-dynamic-import',
          '@babel/plugin-proposal-throw-expressions',
          '@babel/plugin-proposal-object-rest-spread',
          'graphql-tag'
        ],
      }
    }],
  }
  const sqlRule = { test: /\.sql$/, use: ['raw-loader'] }
  const gqlRule = { test: /\.(g(raph)?ql)$/, exclude: /node_modules/, use: ['graphql-tag/loader'] }
  const theRest = {
    test: /\.(?!(m?jsx?|json|wasm|css|html?|sql|g(raph)?ql)$)([^.]+$)/, // match everything else....
    use: [{
      loader: 'url-loader',
      options: {
        limit: 8192,
        name: '[name]_[hash:base64:5].[ext]',
        emitFile: target === 'client',
      }
    }]
  }

  return [babelRule, sqlRule, gqlRule, makeCSSRule(target, args, false), makeCSSRule(target, args, true), theRest]
}

function makeCSSRule(target = 'client', { mode }, useCSSModule = false) {
  const ExtractTextPlugin = require('extract-text-webpack-plugin')

  const cssLoader = {
    loader: 'css-loader' + (target === 'client' ? '' : '/locals'), // /locals doesn't embed css, only exports the identifier mappings
    options: {
      modules: useCSSModule,
      localIdentName: '[local]_[hash:5]',
      minimize: mode === 'development' ? false : { discardComments: { removeAll: true } },
    }
  }
  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      plugins: () => [
        require('postcss-import')({
          resolve(id, basedir) {
            if (/^\./.test(id)) return path.resolve(basedir, id) // resolve relative path anything begin with .
            if (/^~\//.test(id)) return path.resolve('./src', id.slice(2)) // resolve alias ~
            return path.resolve('./node_modules', id) // resolve node_modules
          }
        }),
        require('postcss-cssnext')({
          features: {
            // customProperties: { preserve: true, appendVariables: true }
          }
        })
      ]
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

function makePlugins(target = 'client', { mode, env }) {
  const definitions = Object.keys(env).reduce((p, n) => {
    p['process.env.' + n] = JSON.stringify(env[n])
    return p
  }, {})
  definitions['process.env.APP_ENV'] = JSON.stringify(target)
  definitions['process.env.TEST'] = JSON.stringify(env.TEST || false)

  const plugins = [new webpack.DefinePlugin(definitions)]

  if (target === 'client') {
    plugins.push(new (require('html-webpack-plugin'))({
      template: './src/client/index.html',
    }))
    if (mode === 'production') {
      plugins.push(new (require('extract-text-webpack-plugin'))({
        filename: 'style_[contenthash:base64:5].css'
      }))
    }
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

  compiler.watch({}, logStats)
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
    logStats(err, stats)

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
      if (Date.now() - start > 5000) forkChild() // arbitrarily only after the server has started for more than 5 sec
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

function logStats(err, stats) {
  if (err) throw err
  const target = Object.keys(stats.compilation.options.entry)
  const statString = stats.toString({ colors: true })
  console.log(`\x1b[46m\n\n### ${target} bundle ###\n\n\x1b[0m${statString}\n`)
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
  const { mkdirSync, appendFileSync, writeFileSync } = require('fs')
  const { execSync } = require('child_process')

  ;['./src', './src/client', './src/client/components', './src/client/styles', './src/server', './src/public'].forEach(d => { try { mkdirSync(d) } catch (e) {} }) // eslint-disable-line
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
************************************************************\`)
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
    '@babel/core', '@babel/preset-env', '@babel/preset-stage-0', '@babel/preset-react',
    'html-webpack-plugin', 'extract-text-webpack-plugin', 'offline-plugin',
    'webpack-hot-middleware',
    'eslint', 'babel-eslint',
  ].filter(d => !installedPackages.includes(d)).join(' ')

  if (packageToBeInstalled.length > 0) {
    console.log('Running npm i -D ' + packageToBeInstalled)
    execSync('npm i -D ' + packageToBeInstalled)
  }
}
