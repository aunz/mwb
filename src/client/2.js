// import 'react'
// import 'react-dom'

console.log('From 2b.234')
import './style.css'

export const t = 11122111


if (module.hot) {
  
  // module.hot.decline()
  // module.hot.accept(  function (...arg) {
    
  //   console.log('From 2.js, Accepted 2', ...arg)
  //   console.log('From 2 js the t', t)
  // })

  module.hot.accept()
  module.hot.dispose(function (data) {
    console.log('From 2 js dispose', data, 'the t', t)
  })
  // module.hot.decline()
}