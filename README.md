# Minimalist webpack **4** config boilerplate for client and server

 * Hot loading for both **client** & **server**
 * Assets minification and chunk splitting for production
 * Postcss, autoprefixer
 * Client files hashing for caching
 * Focus on your app logics, leave the build tools to others

### 
  
To start, copy the **mwb.js** into your node project root. You can change its name to anything you like.
```shell
node mwb # start live coding & editing in development mode
node mwb --mode production # build the app for production

node mwb --hot.server # enable HMR in server
```

## Tested in node 10+, npm 6+

----------
### Directory structure:
```
  App
   ├─ /dist/
   |    ├─ /public/
   |    └─ /server/
   └─ /src/ 
       ├─ /client/
       |    ├─ entry.js
       |    ├─ entry.test.js
       |    └─ entry.node.test.js
       ├─ /server/
       |    ├─ entry.js
       |    └─ entry.test.js
       └─ /public/
             └─ favicon.ico

```

To create the directory structure as above, run:
```shell
node mwb --init
```
Don't worry, it won't override anything

---
### How it works:
* Place the mwb.js in your root folder, you can change the name to anything you like
* Create a directory structure as above
* The mwb.js actually produces webpack config objects (client config and server config) and run webpack compilers internally. It reads the src/client/entry.js, processes through webpack and produces a file at dist/public/client.js. The same applies to src/server/entry.js with an output at dist/server/server.js
* During devlopment mode, when you edit the files in the source folder, webpack re-compiles them. Hot module replacement is enabled by default for client, and can be turned on for server with `node mwb.js --mode development --hot.server`. `--mode development` is the default, you don't need to specify it.
* You can also add entry.test.js in either client or server and run them as `node mwb --env.TEST`. The entry.test.js will be processed by webpack with all the loaders and plugins.
* The public folder is for your static assets. All the files and folders in it will be copied to the `dist/public`.
---

### Dependencies
You will need these if you have not istalled them
```shell
  npm i -D webpack
  npm i -D babel-loader file-loader url-loader raw-loader null-loader
  npm i -D style-loader css-loader postcss-loader postcss-import postcss-url postcss-cssnext
  npm i -D babel-preset-react-app babel-preset-stage-0
  npm i -D html-webpack-plugin extract-text-webpack-plugin offline-plugin
  npm i -D webpack-hot-middleware
  npm i -D eslint babel-eslint # optional 

  # or run
  node mwb --init
```

### Details

#### Included loaders:
* [`babel-loader`](https://github.com/babel/babel-loader) with presets (env, stage-0, react-app), plugins (transform-runtime) and cacheDirectory (true).
* `css!postcss` loaders for css with `autoprefixer`, `postcss-import`, `poscss-cssnext`
* To use css module, name your style files as `[file].local.css`. The suffix `.local.css` switches on the `{ option: { module: true } }` in css-loader
* `url-loader` for everything else with limit=8192 & name=[name]_[hash:base64:5].[ext]

Style sheet is **extracted** by `extract-text-webpack-plugin` for the initial chunk. The subsequent chunks will be inlined using `style-loader` in the client. On server, `null-loader` is applied to all css.

### Included plugins
* `extract-text-webpack-plugin` for production mode
* `html-webpack-plugin`
* `webpack.DefinePlugin({ 'process.env.APP_ENV': '"server"' })`for server
* `webpack.DefinePlugin({ 'process.env.APP_ENV': '"client"' })` for clients
* `webpack.DefinePlugin({ 'process.env.NODE_ENV': '"development"' })` in development mode
* `webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' })` in production mode to aid dead code 
* Add more env by `node mwb --env.A apple --env.B banana --env.C cherry`, these will produce `webpack.DefinePlugin({ 'process.env.A': '"apple"' })` and so on
* `offline-plugin` with minification turned on in production mode for client

### Server
* This is optional, in the `src/server/entry.js` you will need some kind of server logic to serve client files, see example at the src/server/entry.js. Or you can create an express server using node mwb --init
* All native modules and assets.json are excluded (treated as external) by webpack using `/^[@a-z][a-z/\.\-0-9]*$/i,` and `/^.?assets\.json$/i` in server, this speeds up build time

### Changing the entry file
By default, it reads `src/client/entry.js` and `src/server/entry.js`. If you need to change it, provide `--entry.client` or `--entry.server`e.g `node mwb --entry.client './other_src/entry.js'`

### Running tests
* `node mwb --env.TEST` webpack will read entry files from `src/client/entry.test.js` and `src/server/entry.test.js`
* `node mwb --env.TEST --env.TEST_CID` webpack will read entry files from `src/client/entry.test.js` and `src/client/entry.node.test.js` and `src/server/entry.test.js`. The `entry.test.js` will be run in the web context, while the `entry.node.test.js` will be run in the Node context (useful for integration test using Puppeteer or similar tests)


### Misc
* All codes wrapped inside `if (process.env.NODE_ENV !== 'production') {}` or `if (process.env.NODE_ENV == 'development') {}` or `if(module.hot) {}` are removed for production
* source map is set to `cheap-module-eval-source-map` for development
* source map is **NOT** included in production mode
* `client_[chunkhash:7].js` `vendor_[chunkhash:7].js` & `style_[contenthash:base64:5].css` in production mode for caching
* `~` is aliased to the `src` directory. For example, `import '~/server/myModule'` === `./src/server/myModule`


