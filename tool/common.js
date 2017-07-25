const WHM = require('webpack-hot-middleware')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const fallback = 'style-loader'

const cssModLoader = {
  loader: 'css-loader',
  options: {
    modules: true,
    localIdentName: '[local]_[hash:base64:5]'
  }
}

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    plugins: () => [
      require('postcss-import')({ path: ['src'] }), // so can import relative to the src folder
      // require('postcss-nesting')(),
      require('postcss-nested')(),
      require('postcss-css-variables')(),
      require('autoprefixer')(),
    ]
  }
}

const ExtractTextLoader = [{
  test: /^((?!\.module).)*css$/i,
  loader: ExtractTextPlugin.extract({
    fallback,
    use: ['css-loader', postcssLoader]
  })
}, {
  test: /\.module\.css$/i,
  loader: ExtractTextPlugin.extract({
    fallback,
    use: [cssModLoader, postcssLoader]
  })
}]

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

function injectWHM(config, compiler, port = 9090) {
  config.entry.client.push('webpack-hot-middleware/client?path=http://' + getIp() + ':' + port + '/__webpack_hmr&overlay=false&reload=true&noInfo=true&quiet=true')
  require('http').createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    WHM(compiler, { log: false })(req, res)
  }).listen(port)
}

module.exports = { ExtractTextLoader, injectWHM }