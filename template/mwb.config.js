/**
  expose functions to alter client, server, or cordova webpack config
  @arg {object} config - a webpack config
  @arg {string} env - one of 'dev', 'test', 'testInNode', or 'build'
  @return {func} cb - a callback will be executed when webpack finishes 
    this func takes 2 arg (err, stats)
  @example

  function alterClient(config, env = 'dev') {
    config.plugins.push(new MyAweSomePlugins()) // add a new plugin
    config.plugins = config.plugins.filter(somecondition) // remove an existing plugin

    if (env === 'build') { doSomething() }

    // optionally return a function to be called when webpack is done processing
    return function (err, stats) {
      doOtherThings(err, stats)
    }

  }
*/


function alterClient(config, env = 'dev') {}
function alterServer(config, env = 'dev') {}
function alterCordova(config, env = 'dev') {}

function noop() {}

module.exports = {
  alterClient,
  alterServer,
  alterCordova,
}
