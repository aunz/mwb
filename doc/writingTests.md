### Writing tests

A file named `entry.test.js` is placed under the `src/client` and `src/server` folder.

```shell
npm test
```

By default, webpack is used to compile and watch test files into the `test\build\client` and `test\build\server` folder. 


You can use any test framework and/or assertion library, specify it in the entry.test.js

```js
//entry.test.js
import mocha from 'mocha'
import test from 'tape'

```