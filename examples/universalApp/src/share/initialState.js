let initialState = {
	req: {
		path: '/',
		params: {},
		query: {}
	},
	spinning: false,
	post: []
}

if (__CLIENT__ && (typeof window !== 'undefined') && window.__INITIAL_STATE__ )	initialState = window.__INITIAL_STATE__


export default initialState