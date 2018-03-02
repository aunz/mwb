import express from 'express'
// import compression from 'compression'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 'loopback')

// app.use(compression())
app.use(express.static('./dist/public'))


// history-api-fallback, uncomment this if you want to send index.html for all GET request and let client do the rendering, e.g single page application
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile('index.html', { root: './dist/public' }, e => e && next())
  } else next()
})


app.listen(process.env.PORT || 3000, process.env.HOST, function () {
  console.log('************************************************************')
  console.log('Express app listening at http://%s:%s', this.address().address, this.address().port)
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('process.pid:', process.pid)
  console.log('__dirname:', __dirname)
  console.log('root:', require('path').resolve())
  console.log('************************************************************')
  // console.log('\n', new Date(), 'PID', process.pid, 'App listening at http://' + this.address().address + ':' + this.address().port, 'with root at:', require('path').resolve(), '\n')
})

export default app


import './1.js'
import('./2.js')
import '~/client/style.css'
if (module.hot) {
  require('~/server/3.js')

  module.hot.accept() // accept changes in this file
  module.hot.accept('./3.js', () => {}) // accept changes in someModule, then involke the callback

  // dispose handler is run before the accept
  module.hot.dispose(() => {
    process.exit(1) || cleanUpSomething()
  })

  // module.hot.decline() // if decline() is involked, dispose() is not called
}

