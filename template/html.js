import assets from '../webpack-assets.json'

export default require('@aunz/simple-template')(require('raw!./index.html'),{
	js: assets.client.js ? '/' + assets.client.js : '',
	css: assets.client.css ? '/' + assets.client.css : ''
})