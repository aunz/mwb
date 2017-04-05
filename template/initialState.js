let initialState = {
  req: {
    path: '/',
    params: {},
    query: {},
  },
}

/* global __CLIENT__ */
if (process.env.APP_ENV === 'web' && window && window.__INITIAL_STATE__) initialState = window.__INITIAL_STATE__ // eslint-disable-line no-underscore-dangle

export default initialState
