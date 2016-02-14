require('shelljs').mkdir('-p', './build/public')
require('shelljs').cp('-rf', './src/static/*', './build/public')
