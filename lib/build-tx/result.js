'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.empty = undefined;
exports.getNonfinalResult = getNonfinalResult;
exports.getFinalResult = getFinalResult;

var _transaction = require('./transaction');

var transaction = _interopRequireWildcard(_transaction);

var _coinselect = require('./coinselect');

var coinselect = _interopRequireWildcard(_coinselect);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// ---------- Output from algorigthm
// 'nonfinal' - contains info about the outputs, but not Trezor tx
// 'final' - contains info about outputs + Trezor tx
// 'error' - some error, so far only NOT-ENOUGH-FUNDS and EMPTY strings
var empty = exports.empty = {
    type: 'error',
    error: 'EMPTY'
};

function getNonfinalResult(result) {
    var max = result.result.max;
    var fee = result.result.fee;
    var feePerByte = result.result.feePerByte;
    var bytes = result.result.bytes;
    var totalSpent = result.result.totalSpent;

    return {
        type: 'nonfinal',
        fee: fee,
        feePerByte: feePerByte,
        bytes: bytes,
        max: max,
        totalSpent: totalSpent
    };
}

function getFinalResult(result, transaction) {
    var max = result.result.max;
    var fee = result.result.fee;
    var feePerByte = result.result.feePerByte;
    var bytes = result.result.bytes;
    var totalSpent = result.result.totalSpent;

    return {
        type: 'final',
        fee: fee,
        feePerByte: feePerByte,
        bytes: bytes,
        transaction: transaction,
        max: max,
        totalSpent: totalSpent
    };
}