## Extending the current configs

The webpack configs can be found in the `tool` directory. File: `webpack.config.js`, `webpack.config.test.js`, `dev.js`, `test.js`, and `build.js`

If you feel the need to extend or alter the configs, you can create a file `mwb.config.js` under the root directory

In the `mwb.config.js`, export the one or all of the following 3 functions
* alterClient
* alterServer
* alterCordova

Each function receive 2 args: config and env.
`config` is an object which you can alter/mutate.
`env` is a string of `dev`, `test`, `testInNode` or `build`. `testInNode` is when client tests are run in node environment.
You can return a function, which takes 2 args: err and stats. This fuction is called when webpack finishes compiling, providing `err` and `stats`.




Example

```js
function alterClient(config, env = 'dev') {
  config.plugins.push(new MyAweSomePlugins()) // add a new plugin
  config.plugins = config.plugins.filter(somecondition) // remove an existing plugin

  if (env === 'build') { doSomething() }

  // optionally return a function to be called when webpack is done processing
  return function (err, stats) {
    doOtherThings(err, stats)
  }
}

module.exports = { alterClient }
```

