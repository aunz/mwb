import assets from '../webpack-assets.json'
import template from '@aunz/simple-template'

export const html = template(require('raw!./index.html'),{
	js: assets.client.js || '',
	style: assets.client.style || ''
})