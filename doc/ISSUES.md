 * extract-text-webpack-plugin doesn't seem to be able to combine imported css
e.g. 
```css
/* file1.css */
@import file2.css
body {
	color: green;
}

/* file2.css */
body {
	border: 1px solid;
}
body {
	font-size: 12px
}

/* result */
body{color:green}body{border:1px solid;font-szie:12px}

/* expect all the body tags combined to be into one*/
```

Temporary workaround: use cssnano to handle the styles.css afterwards

 * Style loader can't be used in server

Temporary workaround: use extract-text-webpack-plugin in server and then delete the styles.css `fs.unlink`


 * Isomorphic/universal rendering problems 
`ReactDomServer.renderToString` in server and `ReactDom.render` in client may not produce the same output (data-reactid, checksum) e.g. using Math.random() 

 * file-loader produce duplicated contents
 When sharing component between client and server, e.g.
 ```jsx
 function Component(props){
   return <img src=require(./largeImage.jpg) />
 }
 ```
The largeImage.jpg will be bunlded in both the public and server directory

But if you gzip the bundle and transfer to deployment server, the duplicated contents won't add up much. However this means it will take up more hard drive space on the server, but hard drive space is relatively cheap

One workaround is [#33](https://github.com/webpack/file-loader/pull/33)


* 