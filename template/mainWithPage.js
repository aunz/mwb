import React from 'react'
import {render} from 'react-dom'
import {createStore} from 'redux'
import page from 'page'

import routes from '../share/routes.js'
import reducers from '../share/reducers'
import initialState from '../share/initialState.js'

const mountNode = document.getElementById('root')
const store = createStore(reducers,initialState)

Object.keys(routes).forEach(k=>{
	page(k,(ctx) => {
		store.dispatch({
			type: 'SET_PATH',
			value: ctx.path
		})

		Promise.resolve(routes[k](store))
		.then(Template => {
			render(<Template store={store}/>, mountNode)
		})
		.catch(e => {
			next(e)
		})		
	})
})


//not found
/*import NotFoundPage from '...'
page('*',(ctx,next)=> {
	render(<NotFoundPage />, mountNode)
})*/

page.start()