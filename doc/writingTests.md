### Writing tests

A file named `entry.test.js` is placed under the `src/client` and `src/server` folder. Mwb also ships with tape as the default testing framework

```
App 
 ├─ /src/ 
 |    ├─ /client/
 |    |    └─ entry.test.js  
 |    └─ /server/
 |         └─ entry.test.js
 └─ /test/
      ├─ /client/
      └─ /server/

```


```shell
npm test
```

By default, webpack is used to watch and compile test files into the `test\build\client` and `test\build\server` folder. Webpack is needed because some files require loaders such as url-loader, file-loader... that cannot be hanlded by node generic `require` or `import`

You can use any test framework and/or assertion library, specify it in the entry.test.js

```js
//entry.test.js
import mocha from 'mocha'
import test from 'tape' 

//import jsdom from 'jsdom' //to run client code insides node

```