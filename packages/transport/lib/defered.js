"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
function create() {
  var _resolve = function _resolve() {};
  var _reject = function _reject(e) {};
  var promise = new Promise(function (resolve, reject) {
    _resolve = resolve;
    _reject = reject;
  });
  var rejectingPromise = promise.then(function () {
    throw new Error("Promise is always rejecting");
  });
  return {
    promise: promise,
    rejectingPromise: rejectingPromise,
    resolve: _resolve,
    reject: _reject
  };
}