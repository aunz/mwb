import '~/client/style.css'
import '~/client/style3.local.css'
import '~/client/1'
import('~/client/2')
import('~/client/3')

console.log('From client entry.js')

if (module.hot) {
  // accept this file entry.js
  module.hot.accept()

  // accept 1.js
  module.hot.accept('./1',  function (...arg) {
    // do something
  })

  module.hot.dispose(function (data) {
    // console.log('dispose', data, 'the t', t)
  })

  module.hot.decline('./2')
}