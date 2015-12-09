const _require = __non_webpack_require__


import React from 'react'
import ReactDOMServer from 'react-dom/server' 


let assetsPath = require('path').resolve('.','build/webpack-assets.json')
let assets = _require(assetsPath)

import T from '../client/client.js'; 


let html = ReactDOMServer.renderToString(
  <html>
  	<head> 
  		<link rel='stylesheet' href={assets.client.css}/> 
  	</head>
  	<body> 
  	123 456121
  	  		<div id='entry'>
  			<T l='12345'/>
  		</div>
  	  <script src={assets.client.js}></script>
  	</body>
  </html>
)
console.log(html,assets)
export default '<!DOCTYPE html>'+html;



if(module.hot) {
	module.hot.accept()	
	delete _require.cache[_require.resolve(assetsPath)]
  assets = _require(assetsPath)
}