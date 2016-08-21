/* @flow weak */
export function debugInOut(target, name, descriptor) {

  const original = descriptor.value
  descriptor.value = function() {
    const self = this;
    const debug = this.debug || (name === 'init' && arguments[0]);
    if (debug) {
      console.log(`[trezor-link] Calling ${target.name}.${name}(${arguments.map(f=>JSON.stringify(f)).join(', ')})`); 
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
  }

  return descriptor
}


