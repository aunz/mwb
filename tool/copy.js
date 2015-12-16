const _root = require('path').resolve()
const fs = require('fs')
fs.stat(_root+'/src/favicon.ico',(err,stats)=>{
  if (err) return console.error('Missing favicon.ico. You can do so by adding one to your src folder')
  fs.createReadStream(_root+'/src/favicon.ico').pipe(fs.createWriteStream(_root+'/build/public/favicon.ico'));
})