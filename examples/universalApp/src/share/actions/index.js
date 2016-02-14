import actionCreator from './actionCreator.js'
import * as types from '../constants.js'

export function setPath(path = '/', params = {}, query ={}) {
	return {
		type: types.SET_PATH,
		path,
		params,
		query
	}
}

export const toggleSpin = actionCreator(types.TOGGLE_SPIN)

export const postFetched = (function() {
	//basic memoised id
	var id = []
	return function(article){		
		if (id.indexOf(article.id) > -1) return {type:''}
		id.push(article)		
		return {
			type: types.POST_FETCHED,
			article
		}
	}	
})()