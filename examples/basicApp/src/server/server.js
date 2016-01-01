'use strict' 

const express = require('express')
const compression = require('compression')

let app = express()   

app.disable('x-powered-by')
app.use(express.static('./build/public'))  


 
app.listen(process.env.PORT || 3000, process.env.HOST, function() {
	console.log('Express app listening at http://%s:%s', this.address().address, this.address().port)
  console.log('NODE_ENV:',process.env.NODE_ENV,require('path').resolve(),__dirname)
})

export default app