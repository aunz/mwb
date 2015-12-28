import React from 'react'
import {Home, About, Post} from './Components/'
import {toggleSpin,postFetched} from './actions'


require('isomorphic-fetch')

export default  {
	['/'](store) {
		return Home
	},
	['/about'](store) {
		return About
	},
	async ['/about/:async'](store) {
		store.dispatch(toggleSpin()) //turn on the spinning wheel
		await new Promise((res,rej) => setTimeout(res,3000))
		store.dispatch(toggleSpin()) //turn off the spinning wheel
		return About
	},
	async ['/post/:article?']({getState,dispatch}) {		
		let article = getState().req.params.article
		if (article) {
			let url = ''
			if (__SERVER__) url += 'http://localhost:' + (process.env.port || 3000)
			url += '/api/post/' + article
			
			await fetch(url)
			  .then(r => {
			  	if (r.status == 404) throw ''
			  	if (r.status == 500) throw new Error('Monkey decided to throw')			  	
			  	return r.json()
			  })
			  .then(r => {dispatch(postFetched(r))})	  

		}			
		return Post
	},
	['/500'](store) {
		throw new Error('Cats no meow')
	}
}