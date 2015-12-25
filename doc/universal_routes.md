## Isomorphic/Universal routes

* In client, use page.js

* In server, use built in Express js

---

###  Define routes
```jsx

// routes.js

import Home from './component/Home'
import Post from './component/Post'
import Author from './component/Author'

// each route is a function with path as name, similar to page('path', cb) and app.get('path', cb).
// each function take in a store param from redux store
// @return Components
// async function is possible as well to 



export constant routes = {
	['/'](store) {
		return Home
  },
	['/post/:id'](store) {
		store.getState() // do something sync		
		return Post
  },
	async ['/author/:id'](store) {
		const param = store.getState().param
		if (__SERVER__) {
		  const db = require('databse')
		  try {
			  const item = await db.connect().getSomeItem()
			  store.dispatch({
			    type: 'ITEM_FETCHED'
			    item
			  })
		  } catch (err) {		    
		    // throw new Error() // to 404
		    // throw new Error(err) //  to 500
		  }
	  } else {
      fetch('somedata').then(r => {
        store.dispatch({
          type: 'ITEM_FETCHED'
		      item
        }) 
      })
	  }
    return Author 
	}
}

```


### client

```jsx

//clientRouter.js, assuming using page and react

import page from 'page'
import React from 'react'
import {render} from 'react-dom'

import routes from './routes'
import store from './store.js'  //the created redux store

Object.keys(routes).forEach(p => {
  const cb = routes[p]
	page(p,(ctx,next)=>{
		let url = ctx.pathname
		let params = ctx.params
		let qs = ctx.querystring
		store.dispatch({
		  type: 'UPDATE_PATH',
		  value : {
		    url,
		    params,
		    qs
		  }
		})
		Promise.resolve(cb(store))
		  .then(Component => {
		    render(<Component store={store} />, mountNode)		  
		  })
		  .catch(err => {
		    next(err)		  
		  })
	})
})

page.start()

```


```jsx

//serverRouter.js

import React from 'react'
import renderToString from 'react-dom/server'

import {createStore} from 'redux'  

import app from './app'
import routes from './routes'
import reducers from './reducers' 


Object.keys(routes).forEach(p => {
  const cb = routes[p]
	app.get(p,(req,res,next)=>{  //the app from express server
		let url = req.url
		let params = req.params
		let qs = req.qs
		const store = createStore(reducers,initialState) //new store for each request
		store.dispatch({
		  type: 'UPDATE_PATH',
		  value : {
		    url,
		    params,
		    qs
		  }
		})
		Promise.resolve(cb(store))
		  .then(Component => {
		    const markup = renderToString(<Component store={store} />, mountNode)
		    const html = `
		      <!DOCTYPE html>
		      <html>
		      	<head>
		      		
		      	</head>
		      	<body>
		      		<div id="app">${markup}</div>
		      	</body>
		      </html>
		    `
		    res.send(html)
		  })
		  .catch(err => {
		    next(err) 
		  })
	})
})

app.use((req,res,next)=>{
  res.status(404)
  res.send('Not found')
})

app.use((err,req,res,next)=>{
  res.status(500)
  res.send(err)
})

```