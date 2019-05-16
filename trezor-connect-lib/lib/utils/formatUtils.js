"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.btckb2satoshib = exports.formatTime = exports.formatAmount = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var currencyUnits = 'btc'; // TODO: change currency units

var formatAmount = function formatAmount(n, coinInfo) {
  var amount = new _bignumber.default(n).dividedBy(1e8);

  if (coinInfo.isBitcoin && currencyUnits === 'mbtc' && amount.lte(0.1)) {
    var _s = new _bignumber.default(n).dividedBy(1e5).toString();

    return _s + " mBTC";
  }

  var s = amount.toString();
  return s + " " + coinInfo.shortcut;
};

exports.formatAmount = formatAmount;

var formatTime = function formatTime(n) {
  var hours = Math.floor(n / 60);
  var minutes = n % 60;
  if (!n) return 'No time estimate';
  var res = '';

  if (hours !== 0) {
    res += hours + ' hour';

    if (hours > 1) {
      res += 's';
    }

    res += ' ';
  }

  if (minutes !== 0) {
    res += minutes + ' minutes';
  }

  return res;
};

exports.formatTime = formatTime;

var btckb2satoshib = function btckb2satoshib(n) {
  return new _bignumber.default(n).times(1e5).toFixed(0, _bignumber.default.ROUND_HALF_UP);
};

exports.btckb2satoshib = btckb2satoshib;