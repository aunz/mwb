By default, cordova config is included in webpack.config.js

To start with a minimum app, under the `App` directory, run
```shell
npm run mwb initMin
cordova create cordova
```

the resulting directorty 
```
App
 ├─ /build/
 ├─ /cordova/
 |    ├─ [cordova inbuilt structure]
 |    └─ /www/
 |         ├─ /js/
 |         ├─ /css/
 |         ├─ /.../
 |         └─ /build/
 |
 ├─ /tool/
 └─ /src/ 
     ├─ /client/
     |    └─ entry.js
     ├─ /share/
     ├─ /server/
     |     └─ entry.js
     |
     └─ /static/
           └─ favicon.ico
```

All the assets (js, css, image etc) will be put under the `./cordova/www/build/`

The default js file is `cordovaBundle.js`, the stylesheet file is `styles.css`. You may wish to update/change this in `cordova/www/index.html`


The `app\src\client\entry.js` is used as a common entry point for web app (browser) and cordova app (hybrid)

To out put the cordova version, type
```shell
npm run dev -- cordovaOnly # or npm run devC
npm run dev -- all # or npm run devA
```

The `cordovaOnly` option will only build cordova (this is usually sufficient if you do not need a server)
The `all` option will build client (browser, cordova) and server

While in development mode, webpack will watch file changes in the `src` directory and recompile to the destination folder `cordova\www\build`.
You can then run [taco](http://taco.tools/docs/run.html) to get livereload on your mobile devices
```shell
taco run [PLATFORM] --livereload
```
Taco is used because cordova by itself doesn't (yet) support livereload when using `cordova run [PLATFORM]`.



Similarly for final build 
```shell
npm run build -- cordovaOnly
npm run build -- all
```


Use `__CORDOVA__` in your js files for codes to be run specifically for cordova
```js
// in src/client/entry.js

console.log('Hello world,')

if (__CORDOVA__) {
  console.log('from Cordova hybrid app')
} else {
  console.log('from normal web app')
}
```

Codes in __CORDOVA__ block will preserved in cordova build but dead-code-elimnated in brower version

