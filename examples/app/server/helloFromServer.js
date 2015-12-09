'use strict'

import assets from '../webpack-assets.json'
 
let html = `
<html> 
	<head>
	 <link rel="stylesheet" type="text/css" href="${assets.client.css || ''}">
  </head>
	<body>
		<h1>Hello world from server</h1>
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