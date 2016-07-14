

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
function create() {
  let _resolve = () => {};
  let _reject = e => {};
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  return {
    promise: promise,
    resolve: _resolve,
    reject: _reject
  };
}