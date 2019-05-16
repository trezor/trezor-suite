"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _pathUtils = require("../utils/pathUtils");

var Account =
/*#__PURE__*/
function () {
  // loading status
  function Account(path, node, coinInfo) {
    (0, _defineProperty2.default)(this, "transactions", 0);
    this.id = (0, _pathUtils.getIndexFromPath)(path);
    this.path = path;
    this.coinInfo = coinInfo;
    this.xpub = node.xpub;
    this.xpubSegwit = node.xpubSegwit;
  }

  var _proto = Account.prototype;

  _proto.isUsed = function isUsed() {
    return this.info && this.info.transactions.length > 0;
  };

  _proto.getPath = function getPath() {
    return this.path;
  };

  _proto.getNextAddress = function getNextAddress() {
    return this.info ? this.info.unusedAddresses[0] : 'unknown';
  };

  _proto.getNextAddressId = function getNextAddressId() {
    return this.info ? this.info.usedAddresses.length : -1;
  };

  _proto.getUsedAddresses = function getUsedAddresses() {
    return this.info ? this.info.usedAddresses : [];
  };

  _proto.getUnusedAddresses = function getUnusedAddresses() {
    return this.info ? this.info.unusedAddresses : [];
  };

  _proto.getTransactionsCount = function getTransactionsCount() {
    return this.info ? this.info.transactions.length : this.transactions;
  };

  _proto.getChangeIndex = function getChangeIndex() {
    return this.info ? this.info.changeIndex : 0;
  };

  _proto.getNextChangeAddress = function getNextChangeAddress() {
    return this.info ? this.info.changeAddresses[this.info.changeIndex] : 'unknown';
  };

  _proto.getAddressPath = function getAddressPath(address) {
    if (!this.info) return this.path;
    var addresses = this.info.usedAddresses.concat(this.info.unusedAddresses);
    var index = addresses.indexOf(address);
    return this.path.concat([0, index]);
  };

  _proto.getBalance = function getBalance() {
    return this.info ? this.info.balance : '0';
  };

  _proto.getConfirmedBalance = function getConfirmedBalance() {
    return this.info ? this.info.balance : '0';
  };

  _proto.getUtxos = function getUtxos() {
    return this.info ? this.info.utxos : [];
  };

  _proto.toMessage = function toMessage() {
    var account = {
      id: this.id,
      path: this.path,
      coinInfo: this.coinInfo,
      xpub: this.xpub,
      xpubSegwit: this.xpubSegwit,
      label: "Account #" + (this.id + 1),
      balance: this.info ? this.info.balance : '-1',
      transactions: this.getTransactionsCount()
    };

    if (typeof account.xpubSegwit !== 'string') {
      delete account.xpubSegwit;
    }

    return account;
  };

  return Account;
}();

exports.default = Account;