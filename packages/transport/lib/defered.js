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
  return {
    promise: promise,
    resolve: _resolve,
    reject: _reject
  };
}