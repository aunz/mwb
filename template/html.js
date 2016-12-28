import assets from '../webpack-assets.json'
import template from '@aunz/simple-template'

export default template(require('raw-loader!./index.html'), {
  js: assets.client.js ? '/' + assets.client.js.replace(/^\/+/, '') : '',
  css: assets.client.css ? '/' + assets.client.css.replace(/^\/+/, '') : '',
})
