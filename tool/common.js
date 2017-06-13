const WHM = require('webpack-hot-middleware')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const cssLoader = [{
  test: /^((?!\.module).)*css$/i,
  loader: ExtractTextPlugin.extract({
    use: ['css-loader', 'postcss-loader']
  })
}, {
  test: /\.module\.css$/i,
  loader: ExtractTextPlugin.extract({
    use: ['css-loader?module&localIdentName=[local]_[hash:7]', 'postcss-loader']
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

module.exports = { cssLoader, injectWHM }
