'use strict'

import sayHello from './app.js'

sayHello('Kitty')

if (module.hot) {
	module.hot.accept()
}