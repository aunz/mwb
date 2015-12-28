import { combineReducers } from 'redux'
import reducerCreator from './reducerCreator.js'
import * as types from '../constants.js'

const req = reducerCreator({
	path: '/',
	params: {},
	query: {}
},{
	[types.SET_PATH](state, {path, params, query}) {
		return {
			path,
			params,
			query
		}
	}
})

const spinning = reducerCreator(false,{
	[types.TOGGLE_SPIN](state, action) {
		return !state
	}
})

const post = reducerCreator([],{
	[types.POST_FETCHED](state, {article}) {		
		return [...state,article]
	}
})

export default combineReducers({
	req,
	spinning,
	post
})

