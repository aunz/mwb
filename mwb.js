/*
  This is a template for building client and server with HMR

  node mwb
    --mode [development | production]   default is development
    --env.TEST    optional, set this when doing tests process.env.TEST === true
    --hot.server   optional, enable HMR for server
*/


const htmlWebpackPlugin = new (require('html-webpack-plugin'))
({
  title: 'My Awesome App',
  template: './src/client/index.html',
})


/* ***** ONLY CHANGE AFTER THIS IF YOU KNOW WHAT YOU ARE DOIG ***** */


/* import stuff */
const path = require('path')
const webpack = require('webpack')

const args = require('minimist')(process.argv.slice(2))

if (!args.mode) args.mode = 'development'

if (!['production', 'development'].includes(args.mode)) throw new Error(`The provided mode: '${args.mode}' is not correct`)

process.env.NODE_ENV = args.mode // has to set this for babel-preset-react-app to work

const clientConfig = makeConfig('client', args) // ; console.log('CCC', clientConfig)
const serverConfig = makeConfig('server', args) // ; console.log('SSS', serverConfig)


if (args.mode === 'production') {
  require('child_process').exec('rm -rf dist') // remove the dist folder

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
} else if (args.mode === 'development') {
  compile_web_devMode(clientConfig, args)
  compile_node_devMode(serverConfig, args)

  // For client tests to run in node env
  if (args.env && args.env.TEST) {
    const clientConfigNode = makeConfig('server', args)
    clientConfigNode.entry.server = ['./src/client/entry.node.test.js']
    clientConfigNode.output.filename = 'node.test.js'

    compile_node_devMode(clientConfigNode, args)
  }
}

copyPublicStuff()

// helper functions
function makeConfig(target = 'client', args) {
  if (!['client', 'server'].includes(target)) throw new Error(`The provided target: '${target}' is not correct`)
  const { mode, env = {} } = args
  const isTEST = mode === 'production' ? false : env.TEST

  const common = {
    resolve: {
      alias: { '~': path.resolve('./src') }
    },
    module: { rules: makeRules(target, args) },
    mode,
  }

  if (mode !== 'production') {
    common.performance = { hints: false }
    common.devtool = 'cheap-module-eval-source-map'
  }

  const entryFilename = isTEST ? 'entry.test.js' : 'entry.js'
  const outputPathname = isTEST ? './dist/test' : './dist'

  if (target === 'client') return {
    ...common,
    entry: {
      client: ['./src/client/' + entryFilename],
    },
    output: {
      filename: mode === 'production' ? '[name]_[chunkhash:7].js' : (isTEST ? 'client.test.js' : 'client.js'),
      path: path.resolve(outputPathname + '/public/'),
      publicPath: '/',
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env.APP_ENV': '"web"' }),
      ...makePlugins(target, args),
      htmlWebpackPlugin,
    ]
  }

  if (target === 'server') return {
    ...common,
    entry: {
      server: ['./src/server/' + entryFilename],
    },
    target: 'node',
    output: {
      filename: isTEST ? 'server.test.js' : 'server.js',
      path: path.resolve(outputPathname + '/server/'),
      libraryTarget: 'commonjs2', // src: const express = require('express') -> webpack builds: const express = require('express'); otherwise webpack builds: const express = express, which is wrong
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env.APP_ENV': '"node"' }),
      ...makePlugins(target, args),
    ],
    externals: [
      /^[@a-z][a-z/\.\-0-9]*$/i, // native modules will be excluded, e.g require('react/server')
      /^.+assets\.json$/i, // these assets produced by assets-webpack-plugin
    ]
  }
}

function makeRules(target = 'client', args) {
  const ExtractTextPlugin = require('extract-text-webpack-plugin')
  const { mode, env = {} } = args

  const rules = [{
    test: /\.jsx?$/,
    exclude: /(node_modules)/,
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
    // exclude: /(node_modules)/,
    use: ['raw-loader'],
  }, {
    test: /\.(?!(jsx?|json|s?css|less|html?|sql)$)([^.]+$)/, // match everything except js, jsx, json, css, scss, less. You can add more
    // exclude: /(node_modules)/,
    use: [{
      loader: 'url-loader',
      query: {
        limit: 10000,
        name: '[name]_[hash:7].[ext]',
        emitFile: target === 'client',
      }
    }],
  }]

  if (target === 'client') {
    const postcssLoader = {
      loader: 'postcss-loader',
      options: {
        plugins: () => [
          require('postcss-import')(),
          // require('postcss-url')(),
          require('postcss-cssnext')(),
        ]
      }
    }

    const productionUse = ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [{ loader: 'css-loader', options: { minimize: { discardComments: { removeAll: true } } } }, postcssLoader]
    })

    const developmentUse = [{ loader: 'style-loader' }, { loader: 'css-loader' }, postcssLoader]

    rules.push({
      test: /\.css$/i,
      use: mode === 'production' ? productionUse : developmentUse
    })
  } else {
    rules.push({ // don't handle css in server
      test: /\.css$/i,
      use: [{ loader: 'null-loader' }]
    })
  }

  return rules
}

function makePlugins(target = 'client', args) {
  if (!['client', 'server'].includes(target)) throw new Error(`The provided target: '${target}' is not correct`)

  const ExtractTextPlugin = require('extract-text-webpack-plugin')
  const { mode, env = {}, hot = {} } = args

  const plugins = [
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode) }),
    new webpack.DefinePlugin({ 'process.env.TEST': mode === 'production' ? false : env.TEST }),
  ]

  if (target === 'client') {
    mode === 'production'
      ? plugins.push(
          new ExtractTextPlugin({ filename: 'styles_[contenthash:7].css', allChunks: false }),
          // new (require('offline-plugin'))({ ServiceWorker: { minify: true } }),
        )
      : ''
  } else {
    mode === 'production'
      ? '' // plugins.push(new ExtractTextPlugin({ filename: 'styles.css', allChunks: true })) // set allChunks to true to move all css into styles.css which will be deleted in the following build step
      : ''
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

  const publicPath = path.resolve('./src/public/', '.')
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

