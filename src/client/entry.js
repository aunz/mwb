

// import '~/client/style.css'
// import React from 'react'
// import { render } from 'react-dom'

let { t } = require('./2')
console.log('the t', t, ++t)
import '~/client/2'

// import('./1')
// import('./2')

console.log('from entry 12')

document.getElementById('root').textContent = t

// render(<div>Hi</div>, document.getElementById('root'))

if (module.hot) {
  // module.hot.accept('./2', function(...arg) {  console.log('accepting ./2', ...arg)  })
  // module.hot.accept('./2',  function (...arg) {
  //   t = require('./2').t
  //   console.log('Accepted 2', ...arg)
  //   console.log('the t', t)
  //   document.getElementById('root').textContent = 'Accepted' + t
  // })

  module.hot.dispose(function (data) {
    console.log('dispose', data, 'the t', t)
  })
  // module.hot.decline()
}