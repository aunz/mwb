import assets from '../webpack-assets.json'
import template from '@aunz/simple-template'

export default template(require('raw!./index.html'),{
	js: assets.client.js || '',
	css: assets.client.css || ''
})