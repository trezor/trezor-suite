"use strict";

exports.__esModule = true;
exports.inputToTrezor = exports.inputToHD = exports.validateTrezorInputs = void 0;

var _bufferUtils = require("../../../utils/bufferUtils");

var _pathUtils = require("../../../utils/pathUtils");

var _index = require("./index");

var _paramsValidator = require("../helpers/paramsValidator");

// local modules

/** *****
 * SignTx: validation
 *******/
var validateTrezorInputs = function validateTrezorInputs(inputs, coinInfo) {
  var trezorInputs = inputs.map(_index.fixPath).map(_index.convertMultisigPubKey.bind(null, coinInfo.network));

  for (var _iterator = trezorInputs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var input = _ref;
    (0, _pathUtils.validatePath)(input.address_n);
    var useAmount = (0, _pathUtils.isSegwitPath)(input.address_n);
    (0, _paramsValidator.validateParams)(input, [{
      name: 'prev_hash',
      type: 'string',
      obligatory: true
    }, {
      name: 'prev_index',
      type: 'number',
      obligatory: true
    }, {
      name: 'script_type',
      type: 'string'
    }, {
      name: 'amount',
      type: 'string',
      obligatory: useAmount
    }, {
      name: 'sequence',
      type: 'number'
    }, {
      name: 'multisig',
      type: 'object'
    }]);
  }

  return trezorInputs;
};
/** *****
 * Transform from Trezor format to hd-wallet, called from SignTx to get refTxs from bitcore
 *******/


exports.validateTrezorInputs = validateTrezorInputs;

var inputToHD = function inputToHD(input) {
  return {
    hash: (0, _bufferUtils.reverseBuffer)(Buffer.from(input.prev_hash, 'hex')),
    index: input.prev_index,
    path: input.address_n,
    amount: input.amount,
    segwit: (0, _pathUtils.isSegwitPath)(input.address_n)
  };
};
/** *****
 * Transform from hd-wallet format to Trezor
 *******/


exports.inputToHD = inputToHD;

var inputToTrezor = function inputToTrezor(input, sequence) {
  var hash = input.hash,
      index = input.index,
      path = input.path,
      amount = input.amount;
  return {
    address_n: path,
    prev_index: index,
    prev_hash: (0, _bufferUtils.reverseBuffer)(hash).toString('hex'),
    script_type: (0, _pathUtils.getScriptType)(path),
    amount: amount,
    sequence: sequence
  };
};

exports.inputToTrezor = inputToTrezor;