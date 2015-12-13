#Minimalist boilerplate for Webpack +/- Express 

 * Hot loading for both **client** & **server**
 * Code in es2015
 * CSS module + postcss + autoprefixer
 * Assets minification for production
 * Client files hashing for caching

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
 └─ /src/ 
     ├─ /client/
     |    └─ entry.js
     ├─ /shared/
     ├─ /server/
     |     ├─ entry.js
     |     ├─ app.js // the express server app
     |     └─ main.js
     ├─ alias.json
     ├─ loaders.json
     └─ plugins.json

```
---
###How it works:
* After initiation, an entry.js file is placed in the src/client and src/server folder
* `npm run dev` uses webpack to compile and watch these files and output them into the build folder -> clientBundle.js and serverBundle.js
* serverBundle.js is run automatically and will be served at localhost:3000 (default using express js)
* When you edit the files in the source folder, webpack re-compile required files
* To enable hot module replacement, add `if (module.hot) {module.hot.accept()}` in your code

---
###Details

####Included loaders:
* [`babel loader`](https://github.com/babel/babel-loader) with presets (react, es2015, stage-0), plugins (transform-runtime) and cacheDirectory (true)
* `json` loader for json
* `url` loader for png|jpg|jpeg|gif|mp3 with limit=10000 & name=[name]_[hash:6].[ext]
* `raw` loader for txt
* `style!css?modules!postcss` loaders for css with `autoprefixer` during development mode

When bundling for production, a single style sheet is **extracted** by `extract-text-webpack-plugin` with `{allChunks:true}` using `css?module&minimize&localIdentName=[local]_[hash:6]!postcss` 

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
* Use `compression` middleware, then `static('./build/client')` middleware
* Server code is hot replaced in development mode, but NOT in production mode
* All native modules and assets.json are excluded (treated as external) by webpack using `/^[@a-z][a-z\/\.\-0-9]*$/i,` and `/^.?assets\.json$/i` in server, this speeds up build time


### Misc
* All codes wrapped inside `if (process.env.NODE_ENV !== 'production') {}` or `if (process.env.NODE_ENV == 'development') {}` or `if(module.hot) {}` are removed for production
* source map is set to `devtool = eval` for development
* source map is **NOT** included in production mode
* `clientBundle_[hash:6].js` & `styles_[contenthash:6].css` in production mode for caching
* You can add customized alias, loaders and plugins 
```js
//Examples:

//alias.json, to load react stuff
{
  "react": "react/dist/react.min.js",
  "react-dom": "react-dom/dist/react-dom.min.js"
}
//these alias will also be automatically included in the module.noParse to speed up build time during development. But they are not included in production mode, because webpack in combination with uglifyJS plugin can achieve better minification with source codes https://github.com/webpack/webpack/issues/615 


//loaders.json to handle mid, docs, xlsx, pdf files etc
[{
  "test":/mid|docx|xlsx|pdf/,
  "loader": "file?name=[name]_[hash:6].[ext]"
}]
```


###Todo