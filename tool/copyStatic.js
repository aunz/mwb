const { mkdir, cp } = require('shelljs')

const dir = './build/public'
mkdir('-p', dir)
cp('-rf', './src/static/*', dir)
