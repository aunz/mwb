## Isomorphic/Universal routes

* In client, use page.js

* In server, use built in Express js

---

###  Define routes
```js

//routes.js

// key is path, similar to those in page.js and express.js
// value is tempalte

import Home from './component/Home'
import Post from './component/Post'
import Author from './component/Author'
import NotFound from './component/NotFound'

const routes = {
	'/': Home,
	'/post/:id': Post,
	'/author/:id': Author,
	'*': NotFound
}

export default routes
```


### client

```js

//clientRouter.js, assuming using page and react

import page from 'page'
import React from 'react'
import ReactDom from 'react-dom'

import routes from './routes'

Object.keys(routes).forEach(k => {
	const Com = routes[k]
	page(k,(ctx,next)=>{
		let params = ctx.params
		let querystring = ctx.querystring
		ReactDom.render(<Com {...params,} />)
	})
})

page.start()

```