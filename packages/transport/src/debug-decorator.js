/* @flow weak */

export function debugInOut(target, name, descriptor) {
  const original = descriptor.value;
  descriptor.value = function () {
    const debug = this.debug || (name === `init` && arguments[0]);
    const objName = this.name;
    const argsArr = Array.prototype.slice.call(arguments);
    if (debug) {
      console.log(`[trezor-link] Calling ${objName}.${name}(`, ...(argsArr.map(f => {
        if (typeof f === `string`) {
          if (f.length > 1000) {
            return `${f.substring(0, 1000)}...`;
          }
        }
        return f;
      })), `)`);
    }
    // assuming that the function is a promise
    const resP = original.apply(this, arguments);
    return resP.then(function (res) {
      if (debug) {
        if (res == null) {
          console.log(`[trezor-link] Done ${objName}.${name}`);
        } else {
          console.log(`[trezor-link] Done ${objName}.${name}, result `, res);
        }
      }
      return res;
    }, function (err) {
      if (debug) {
        console.error(`[trezor-link] Error in ${objName}.${name}`, err);
      }
      throw err;
    });
  };

  return descriptor;
}
