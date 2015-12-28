const express = require('express')
const compression = require('compression')

let app = express()   

app.disable('x-powered-by')
app.use(compression())
app.use(express.static('./build/public'))

app.listen(process.env.PORT || 3000 ,process.env.HOST, function() {
	console.log('Express app listening at http://%s:%s', this.address().address, this.address().port)
  console.log('NODE_ENV:',process.env.NODE_ENV)
  console.log('process.pid:',process.pid)
  console.log('__dirname:',__dirname)
  console.log('root:',require('path').resolve())
})
export default app