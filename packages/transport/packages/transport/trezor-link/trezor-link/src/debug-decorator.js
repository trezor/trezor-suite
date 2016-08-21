/* @flow weak */

export function debugInOut(target, name, descriptor) {
  const original = descriptor.value;
  descriptor.value = function () {
    const debug = this.debug || (name === `init` && arguments[0]);
    const argsArr = Array.prototype.slice.call(arguments);
    if (debug) {
      console.log(`[trezor-link] Calling ${target.name}.${name}(${argsArr.map(f => JSON.stringify(f)).join(`, `)})`);
    }
    // assuming that the function is a promise
    const resP = original.apply(this, arguments);
    return resP.then(function (res) {
      if (debug) {
        if (res == null) {
          console.log(`[trezor-link] Done ${target.name}.${name}`);
        } else {
          console.log(`[trezor-link] Done ${target.name}.${name}, result ${JSON.stringify(res)}`);
        }
      }
      return res;
    }, function (err) {
      if (debug) {
        console.error(`[trezor-link] Error in ${target.name}.${name}`, err);
      }
      throw err;
    });
  };

  return descriptor;
}
