import React from 'react' 
import { render } from 'react-dom'
import { createStore } from 'redux'
import page from 'page'

import routes from '../share/routes.js'
import reducers from '../share/reducers'
import initialState from '../share/initialState.js'

const mountNode = document.getElementById('root')
const store = createStore(reducers, initialState)

/*
 ********************
 * Universal routes *
 ********************
*/

/* Object.keys(routes).forEach(k=>{
	page(k,({path,params,querystring},next) => {

		store.dispatch(setPath(path,params,parse(querystring)))

		Promise.resolve(routes[k](store))
		.then(Template => {
			render(<Template store={store} />, mountNode)
		})
		.catch(e => {
			if (!e) return next()
			setTimeout(()=>{throw e})
		})

	})
})

page('*', (ctx,next)=> {
	render(<NotFoundPage req={ctx.path} />, mountNode)
})

window.addEventListener('error', e => {
	event.preventDefault()
	render(<ErrorPage error={e.error.toString()} />, mountNode)
})

page.start()
*/
