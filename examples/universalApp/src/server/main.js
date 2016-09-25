import React from 'react'
import { renderToString } from 'react-dom/server'
import { createStore } from 'redux'
import simpleTemplate from '@aunz/simple-template'

import routes from '../share/routes.js'
import { setPath } from '../share/actions'
import reducers from '../share/reducers'
import initialState from '../share/initialState.js'

import html from '../share/html.js'

import app from './app.js'

import db from './database.js'

app.get('/api/post/:article', (req, res, next) => {
  console.log('fetching article', req.ip)
  const id = req.params.article | 0
  if (id === 5) throw new Error('Mokey decided to throw')
  db.findOne({ id }, (e, r) => {
    if (e) return next(e)
    if (r) return res.json(r)
    return next()
  })
})

/*
 ********************
 * Universal routes *
 ********************
*/

Object.keys(routes).forEach(k => {
  app.get(k, (req, res, next) => {
    const store = createStore(reducers, initialState)
    store.dispatch(setPath(req.url, req.params, req.query))
    Promise.resolve(routes[k](store)).then(Template => {
      const result = simpleTemplate(html, {
        title: store.getState().title || 'App',
        markup: renderToString(<Template store={store} />) || '',
        initialState: JSON.stringify(store.getState())
      })
      res.send(result)
    }).catch(e => {
      next(e)
    })
  })
})


import { NotFoundPage } from '../share/Components'

app.use((req, res) => {
  res.status(404)
  console.log('404', req.ip)
  const result = simpleTemplate(html, {
    title: 'App',
    markup: renderToString(<NotFoundPage req={req.url} />) || '',
    initialState: JSON.stringify(initialState)
  })
  res.send(result)
})

import { ErrorPage } from '../share/Components'

app.use((err, req, res) => {
  res.status(500)
  console.log('500', req.ip, err)
  const result = simpleTemplate(html, {
    title: 'App',
    markup: renderToString(<ErrorPage error={err.toString()} />) || '',
    initialState: JSON.stringify(initialState)
  })
  res.send(result)
})
