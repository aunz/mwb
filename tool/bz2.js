'use strict' //eslint-disable-line

// create a bundle.tar.bz2

const pkjson = require('../package.json')
delete pkjson.devDependencies

const writeFileSync = require('fs').writeFileSync
writeFileSync('package.json.temp', JSON.stringify(pkjson, null, 2))

const execSync = require('child_process').execSync
execSync('tar --transform="flags=r;s|package.json.temp|package.json|" -cvjf bundle.tar.bz2 package.json.temp build')
execSync('rm package.json.temp')

// https://en.wikibooks.org/wiki/Guide_to_Unix/Commands/File_Compression
// http://stackoverflow.com/questions/21790843/how-to-rename-files-you-put-into-a-tar-archive-using-linux-tar
