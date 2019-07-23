"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = exports.remove = exports.create = void 0;

var _Account = _interopRequireDefault(require("./Account"));

var accounts = [];

var create = function create(path, node, coinInfo) {
  // TODO check existence
  var account = new _Account.default(path, node, coinInfo);
  accounts.push(account);
  return account;
};

exports.create = create;

var remove = function remove(account) {
  var index = accounts.indexOf(account);

  if (index >= 0) {
    accounts.splice(index, 1);
  }
};

exports.remove = remove;
var _default = _Account.default;
exports.default = _default;