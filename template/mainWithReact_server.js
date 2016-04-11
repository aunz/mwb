import app from './app.js'
// import db from 'mongo.js'

import React from 'react'
import { renderToString } from 'react-dom/server'

import { createStore } from 'redux'
import reducers from '../share/reducers'

import routes from '../share/routes.js'
import initialState from '../share/initialState.js'

import html from '../share/html.js'
import simpleTemplate from '@aunz/simple-template'

// import {} from '../share/Components'


/*
 ********************
 * Universal routes *
 ********************
*/

Object.keys(routes).forEach(k => {
  app.get(k, (req, res, next) => {
    const store = createStore(reducers, initialState)
    store.dispatch({
      type: 'SET_PATH',
      value: req.url,
    })
    Promise.resolve(routes[k](store)).then(Template => {
      const result = simpleTemplate(html, {
        title: store.getState().title || 'App',
        markup: renderToString(<Template store={store} />) || '',
        initialState: JSON.stringify(store.getState()),
      })
      res.send(result)
    }).catch(e => {
      console.log('Caught error', e)
      next(e)
    })
  })
})

/*
Object.keys(routes).forEach(k => {
	app.get(k,(req,res,next)=>{
		const store = createStore(reducers,initialState)
		store.dispatch(setPath(req.url,req.params,req.query))
		Promise.resolve(routes[k](store))
		.then(Template => {
			const result = simpleTemplate(html,{
				title: store.getState().title || 'App',
				markup: renderToString(<Template store={store} />) || '',
				initialState: JSON.stringify(store.getState())
			})
			res.send(result)
		})
		.catch(e => {
			next(e)
		})
	})
})

import {NotFoundPage} from '../share/Components'
app.use((req,res,next) => {
	res.status(404)
	console.log('404',req.ip)
	const result = simpleTemplate(html,{
		title: 'App',
		markup: renderToString(<NotFoundPage req={req.url} />) || '',
		initialState: JSON.stringify(initialState)
	})
	res.send(result)
})

import {ErrorPage} from '../share/Components'
app.use((err, req, res, next) => {
	res.status(500)
	console.log('500',req.ip,err)
	const result = simpleTemplate(html,{
		title: 'App',
		markup: renderToString(<ErrorPage error={err.toString()} />) || '',
		initialState: JSON.stringify(initialState)
	})
	res.send(result)
})
*/
