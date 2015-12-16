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