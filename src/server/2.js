console.log('\n\n\n\n\nfrom 2311223')

if (module.hot) {
  module.hot.accept(function (...arg) {
    console.log('accpeting self in 2.js', ...arg)
  })
  module.hot.dispose(function (data) {
    console.log('disposing 2.js 123', data)
  })
  console.log('from 2.js', module.hot.status() )
}


console.log('End 2.js1\n\n\n\n')