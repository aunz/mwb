'use strict' 

const express = require('express')
const compression = require('compression')

let app = express()   

app.disable('x-powered-by')
app.use(compression())
app.use(express.static('./build/client'))  
 
app.listen(process.env.port || 3000, function() {
	console.log('Express app listening at http://%s:%s', this.address().address, this.address().port)
  console.log('NODE_ENV:',process.env.NODE_ENV,require('path').resolve(),__dirname)
})

export default app