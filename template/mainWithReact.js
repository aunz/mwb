import React from 'react'
import {renderToString} from 'react-dom/server'
import {createStore} from 'redux'
import {inspect} from 'util'
import simpleTemplate from '@aunz/simple-template'

import routes from '../share/routes.js'
import reducers from '../share/reducers'
import initialState from '../share/initialState.js'

import html from '../share/html.js'


//app.get


// Get
Object.keys(routes).forEach(k => {
	app.get(k,(req,res,next)=>{
		const store = createStore(reducers,{})
		store.dispatch({
			type: 'SET_PATH',
			value: req.url
		})		
		Promise.resolve(routes[k](store))
		.then(Template => {
			const result = simpleTemplate(html,{
				title: store.getState().title || 'App',
				markup: renderToString(<Template store={store}/>) || '',
				initialState: inspect(store.getState())
			})			
			res.send(result)
		})
		.catch(e => {
			console.log('Caught error',e)
			next(e)
		})
	})
})

//404
// import NotFoundPage from '...'
app.use((req,res,next) => {
	res.status(404)
	const result = simpleTemplate(html,{
		title: 'App',
		markup: renderToString(<NotFoundPage />) || '',
		initialState: inspect({})
	})			
	res.send(result)
})


//500
// import ErrorPage from '...'
app.use((err,req,res,next)=>{	
	res.status(500)
	const result = simpleTemplate(html,{
		title: 'App',
		markup: renderToString(<ErrorPage />) || '',
		initialState: inspect({})
	})			
	res.send(result)
})