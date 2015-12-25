if (__SERVER__) {
	var initialState = {}
}

if (__CLIENT__) {
	var initialState = window.__INITIAL_STATE__ || {}
}

export default initialState