require('shelljs/global')

let start = Date.now()

cd(__dirname)

rm('-fr','build')
mkdir('build')
cd('build')

exec('npm init -f')
exec('npm i ../../ -D')
exec('npm run mwb initFull')

console.log('Initiation took', Date.now() - start, 'ms')

exec('npm run dev')
