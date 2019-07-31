'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.uniq = uniq;
exports.stringToHex = exports.reverseBuffer = void 0;

var _ = _interopRequireWildcard(require("lodash"));

var reverseBuffer = function reverseBuffer(buf) {
  var copy = Buffer.alloc(buf.length);
  buf.copy(copy);
  [].reverse.call(copy);
  return copy;
};

exports.reverseBuffer = reverseBuffer;

function uniq(array, fun) {
  return _.uniq(array, fun);
}

var stringToHex = function stringToHex(str) {
  var hex = '';

  for (var i = 0; i < str.length; i++) {
    hex += str[i].charCodeAt(0).toString(16);
  }

  return hex;
};

exports.stringToHex = stringToHex;