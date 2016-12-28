/**
 * Modified from the https://github.com/webpack/webpack/blob/master/hot/poll.js
 * change polling to process.on('message')
 */
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
/*globals __resourceQuery */
if (module.hot) {
  function checkForUpdate(fromUpdate) {
    module.hot.check().then(function(updatedModules) {
      if (!updatedModules) {
        if (fromUpdate) console.log("[HMR] Update applied.");
        else console.warn("[HMR] Cannot find update.");
        return;
      }
      return module.hot.apply({
        ignoreUnaccepted: false,
        onUnaccepted: function(data) {
          console.warn("Ignored an update to unaccepted module " + data.chain.join(" -> "));
        },
      }).then(function(renewedModules) {
        require("./log-apply-result")(updatedModules, renewedModules);
        checkForUpdate(true);
      });
    }).catch(function(err) {
      var status = module.hot.status();
      if (["abort", "fail"].indexOf(status) >= 0) {
        console.warn("[HMR] Cannot apply update.");
        console.warn("[HMR] " + err.stack || err.message);
        console.warn("[HMR] You need to restart the application!");
        process.exit(1)
      } else {
        console.warn("[HMR] Update failed: " + err.stack || err.message);
      }
    });
  }
  process.on("message", function(m) {
    if (m != __resourceQuery.substr(1)) return
    if (module.hot.status() !== "idle") {
      console.warn("[HMR] Got signal but currently in " + module.hot.status() + " state.");
      console.warn("[HMR] Need to be in idle state to start hot update.");
      return;
    }
    checkForUpdate();
  });
} else {
  throw new Error("[HMR] Hot Module Replacement is disabled.");
}
