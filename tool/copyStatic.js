const dir = './build/public'
require('shelljs').mkdir('-p', dir)
require('shelljs').cp('-rf', './src/static/*', dir)
