import app from './server.js'

app.use('/',(req,res,next) => {
	let html = require('./helloFromServer.js')
	html = html.replace('{req.url}',req.url)
	html = html.replace('{new Date}',new Date)
	res.send(html)
})

