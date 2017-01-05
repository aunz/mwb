import app from './app.js'

// default line to be removed with your app logic
import assets from '../webpack-assets.json'

const html = `
<html>
  <head>
    <link rel="stylesheet" type="text/css" href="${process.env.NODE_ENV !== 'development' ? assets.vendor.css || '' : ''}">
    <link rel="stylesheet" type="text/css" href="${assets.client.css || ''}">
  </head>
  <body>
    Hello World
    <script src="${process.env.NODE_ENV !== 'development' ? assets.vendor.js : ''}"></script>
    <script src="${assets.client.js}"></script>
  </body>
</html>
`

app.use((req, res, next) => { // eslint-disable-line no-unused-vars
  res.type('html')
  res.send(html)
})
