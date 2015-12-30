import test from 'tape'

import jsdom from 'jsdom'

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err)
})


test('Client side', t => {
	// t.plan(2)	
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
    	
  		/*await click(document.getElementsByTagName('a')[1])    		
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

			await click(document.getElementsByTagName('a')[0],20) //timeout a bit longer
  		t.ok(document.body.textContent.indexOf('I like to sleep all day!') > -1 ,'The Cat like to sleep all day')

  		window.history.back()
  		await click()

  		await click(document.getElementsByTagName('a')[1],10)
  		t.notOk(document.body.textContent.indexOf('I like to sleep all day!') > -1 ,'Should not have lazy cat')
  		t.ok(document.body.textContent.indexOf('Where are the sheeps') > -1 ,'The dog is looking for sheeps')

  		window.history.back()
  		await click()

  		await click(document.getElementsByTagName('a')[3],10)    		
  		t.ok(document.body.textContent.indexOf("404 Can't find the things you are looking for at /post/4") > -1 ,'Should display a 404 page')
  		
			window.history.back()
  		await click()*/

	    // await click(document.getElementsByTagName('a')[3])    		
    	// click(document.getElementsByTagName('a')[4],101)


	

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



    	setTimeout(function(){
    		throw new Error()
    	})