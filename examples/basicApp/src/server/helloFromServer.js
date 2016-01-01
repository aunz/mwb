'use strict'

/*
  Edit this file while the express server is running
  The express server will not stop and re start
  Instead, this html will be updated
  Press F5 on your browser to see new update
*/
import assets from '../webpack-assets.json'
 
let html = `
<html> 
	<head>
	 <link rel="stylesheet" type="text/css" href="${assets.client.css || ''}">
  </head>
	<body>
		<h1>Hello world from server</h1>

		<!-- uncomment me or edit me while the server is running -->

		<p>The requested url is {req.url}</p>
		<p>The current time is now {new Date}</p>
		<script src="${assets.client.js}"></script> 
	</body>
</html>
`

module.exports = html

if (module.hot) {
	module.hot.accept()
}