let initialState = {}

if (__CLIENT__ && window && window.__INITIAL_STATE__) initialState = window.__INITIAL_STATE__ 

export default initialState