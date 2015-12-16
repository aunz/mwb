import app from './app.js'

//default line to be removed with your app logic
import assets from '../webpack-assets.json'

app.use((req,res,next) => {
	let html = `
<html>
	<head>
		 <link rel="stylesheet" type="text/css" href="${assets.client.css || ''}"">
	</head>
	<body>
		Hello World
	<script src="${assets.client.js}"></script>
	</body>
</html>`

	res.type('html')
	res.send(html)
})