import test from 'tape'
import jsdom from 'jsdom'
import {request} from 'http'


test('Response Header using http request', t => {
  t.plan(15)

  req('/',(e,r) => {
    t.equal(r.statusCode,200,'main page, should get 200 response')
    t.ok(r.body.indexOf('Hello World') > -1,'main page, should have hello world')
  })

  req('/about',(e,r) => {    
    t.ok(r.body.indexOf('About: Eat fruits &amp; veges only, save the planet!') > -1,'about page, should have veges')
  })

  let s = Date.now()
  req('/about/async', (e,r) => {
    console.log('/about/async response time', Date.now() - s)
    t.ok((Date.now() - s) > 3000 && (Date.now() - s) < 4000,'/about/async page should response after 3s but less than 4s' )
    t.ok(r.body.indexOf('About: Eat fruits &amp; veges only, save the planet!') > -1,'It also should have veges')
  })

  req('/404', (e,r) => {
    t.equal(r.statusCode,404,'404 page, should get 404 response')
    t.ok(r.body.indexOf("find the things you are looking for") > -1,'Should also have 404 message')
  })

  req('/500', (e,r) => {
    t.equal(r.statusCode,500,'500 page, should get 500 response')    
    t.ok(r.body.indexOf("Error: Cats no meow") > -1,'Cats no meow')
  })

  req('/post/1', (e,r) => {    
    t.ok(r.body.indexOf("I like to sleep all day!") > -1,'/post/1 page, lazy cat')
  })

  req('/post/3', (e,r) => {    
    t.ok(r.body.indexOf("Why do humans think we like cheese, they stink!") > -1,'/post/3 page, cheesy mouse')
  })  

  req('/post/4', (e,r) => {
    t.equal(r.statusCode,404,'/post/4 page, should get 404 response')    
    t.ok(r.body.indexOf("find the things you are looking") > -1,'Should also have 404 message')
  })

  req('/post/5', (e,r) => {
    t.equal(r.statusCode,500,'/post/5 page, should get 500 response')
    t.ok(r.body.indexOf("Error: Monkey decided to throw") > -1,'Monkey throws')    
  })

  function req(url,cb) {
    request('http://localhost:3000' + url, res => {
      let body = ''
      res.on('data', chunk => {body += chunk})
      res.on('end',() => {
        res.body = body
        cb(null,res)        
      })
      res.on('error', e => {
        cb(e,null)
      })
    }).end()  
  }

})



test('Displaying correct html client side using jsdom', t => {
	// t.plan(10)	
	jsdom.env({
		url: 'http://localhost:3000',
		virtualConsole: jsdom.createVirtualConsole().sendTo(console),
		features: {
			FetchExternalResources: ['script'],
			ProcessExternalResources: ['script'],
		},
		async done(err, window) {			
    	if (err) return t.fail("Can't load localhost")
    	t.pass('Loaded')

    	//shortcut
    	const document = window.document

    	window.addEventListener('error', (e,a,b) => {
    		console.log('Error....!',e,a,b)
    		// e.preventDefault()
    		// return false
    		e.preventDefault()
    	})
    	
  		await click(document.getElementsByTagName('a')[1])    		
  		t.ok(document.body.textContent.indexOf('About: Eat fruits & veges only, save the planet!') > -1 ,'Clicked on About page, should have veges')
  		
  		window.history.back()
  		await click()
  		
  		await click(document.getElementsByTagName('a')[2])
  		t.notOk(document.body.textContent.indexOf('About: Eat fruits & veges only, save the planet!') > -1 ,'Clicked on About Async page immediately, should NOT have veges')
  		await click(null,1000); t.notOk(document.body.textContent.indexOf('About: Eat fruits & veges only, save the planet!') > -1 ,'Clicked on About Async page after 1 s, still should NOT have veges')
  		await click(null,1000); t.notOk(document.body.textContent.indexOf('About: Eat fruits & veges only, save the planet!') > -1 ,'Clicked on About Async page after 2 s, still should NOT have veges')
  		await click(null,1000); t.ok(document.body.textContent.indexOf('About: Eat fruits & veges only, save the planet!') > -1 ,'Clicked on About Async page after 3 s, should HAVE veges now')
  		
  		window.history.back()
  		await click()

  		await click(document.getElementsByTagName('a')[3])
  		t.ok(document.body.textContent.indexOf('The main article page') > -1 ,'Clicked on main Post page')

			await click(document.getElementsByTagName('a')[0],15) //timeout a bit longer
  		t.ok(document.body.textContent.indexOf('I like to sleep all day!') > -1 ,'The Cat like to sleep all day')

  		window.history.back()
  		await click()

  		await click(document.getElementsByTagName('a')[1],15)
  		t.notOk(document.body.textContent.indexOf('I like to sleep all day!') > -1 ,'Should not have lazy cat')
  		t.ok(document.body.textContent.indexOf('Where are the sheeps?') > -1 ,'The dog is looking for sheeps')

  		window.history.back()
  		await click()

  		await click(document.getElementsByTagName('a')[3],15)    		
      t.ok(document.body.textContent.indexOf("404 Can't find the things you are looking for at /post/4") > -1 ,'Should display a 404 page')
      
      window.history.back()
      await click()

      await click(document.getElementsByTagName('a')[3])        
      click(document.getElementsByTagName('a')[4])

      process.on('uncaughtException', function(err) {
        t.equal(err.message,'Monkey decided to throw','Threw a 500 error')
      })




	

			function click(node, timeout) {
				return new Promise(r => {
					if (node) {
						let event = new window.MouseEvent('click', {bubbles: true,cancelable: true})
			      event.which = 1 // to be compatible with page.js
			      node.dispatchEvent(event)				
					}
		      setTimeout(r, timeout)	
				})
    	}

    	t.end()
    }
	})

})