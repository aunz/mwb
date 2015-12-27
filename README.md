#Minimalist boilerplate for Webpack +/- Express 

 * Hot loading for both **client** & **server**
 * Code in es2015
 * CSS module + postcss + autoprefixer
 * Assets minification for production
 * Client files hashing for caching
 * Focus on your app logics, leave the build tools to others

### 
  
To start
```shell
mkdir myApp
cd myApp

npm init
npm i --save-dev mwb

npm run mwb init # generate the boilerplate with an express server
npm run mwb initMin # generate the boilerplate without a server

npm run dev # start live coding & editing in development mode

npm run bundle # bundling the app for production mode
```
###Requires node >= 4.0.0

----------
###Directory structure:
```
App
 ├─ /build/
 ├─ /tool/
 └─ /src/ 
     ├─ /client/
     |    └─ entry.js
     ├─ /share/
     ├─ /server/
     |     ├─ entry.js
     |     ├─ app.js 
     |     └─ main.js
     └─ /static/
           └─ favicon.ico


```
---
###How it works:
* After initiation, an entry.js file is placed in the src/client and src/server folder
* `npm run dev` uses webpack to compile and watch these files and output them into the build folder -> clientBundle.js and serverBundle.js
* serverBundle.js is run automatically and will be served at localhost:3000 (default using express js)
* When you edit the files in the source folder, webpack re-compile required files
* To enable hot module replacement, add `if (module.hot) {module.hot.accept()}` in your code
* Default webpack.config.js is in the tool directory

---
###Details

####Included loaders:
* [`babel loader`](https://github.com/babel/babel-loader) with presets (react, es2015, stage-0), plugins (transform-runtime) and cacheDirectory (true)
* `json` loader for json
* `url` loader for png|jpg|jpeg|gif|mp3 with limit=10000 & name=[name]_[hash:6].[ext]
* `raw` loader for txt
* `css?modules!postcss` loaders for css with `autoprefixer` during development mode

Style sheet is **extracted** by `extract-text-webpack-plugin` with `{allChunks:true}` using `css?module&minimize&localIdentName=[local]_[hash:6]!postcss` 

###Included plugins
* `extract-text-webpack-plugin`
* `webpack.optimize.DedupePlugin` 
* `webpack.optimize.AggressiveMergingPlugin`
* `webpack.optimize.UglifyJsPlugin({compress: {warnings: false}, sourceMap: false})`  
* `webpack.DefinePlugin({__SERVER__:true})`for server
* `webpack.DefinePlugin({__CLIENT__:true})` for client
* `webpack.DefinePlugin({'process.env.NODE_ENV':'"development"'})` in development mode
* `webpack.DefinePlugin({'process.env.NODE_ENV':'"production"'})` in production mode to aid dead code elimination during minification

### Express server
* Listen to 3000 by default or `process.env.PORT`
* Use `compression` middleware, then `static('./build/public')` middleware
* Server code is hot replaced in development mode, but NOT in production mode
* All native modules and assets.json are excluded (treated as external) by webpack using `/^[@a-z][a-z\/\.\-0-9]*$/i,` and `/^.?assets\.json$/i` in server, this speeds up build time


### Misc
* All codes wrapped inside `if (process.env.NODE_ENV !== 'production') {}` or `if (process.env.NODE_ENV == 'development') {}` or `if(module.hot) {}` are removed for production
* source map is set to `cheap-module-eval-source-map` for development
* source map is **NOT** included in production mode
* `clientBundle_[hash:6].js` & `styles_[contenthash:6].css` in production mode for caching


### Mongodb

```shell
npm run mwb initMongo
```
This add the latest mongodb native driver to the app. 
This also add a file named `mongo.js` into the src/server folder.
The mongo.js file contains and export the default connection. 
In an imported file, use async & await to retrive the connection and db. 


### [React & Redux](./doc/react.md)

### [Writing tests](./doc/writingTests.md)

