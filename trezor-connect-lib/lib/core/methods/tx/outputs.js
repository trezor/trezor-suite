"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.outputToTrezor = exports.validateHDOutput = exports.validateTrezorOutputs = void 0;

var _bchaddrjs = _interopRequireDefault(require("bchaddrjs"));

var _pathUtils = require("../../../utils/pathUtils");

var _addressUtils = require("../../../utils/addressUtils");

var _index = require("./index");

var _paramsValidator = require("../helpers/paramsValidator");

// npm packages
// local modules

/** *****
 * SignTransaction: validation
 *******/
var validateTrezorOutputs = function validateTrezorOutputs(outputs, coinInfo) {
  var trezorOutputs = outputs.map(_index.fixPath).map(_index.convertMultisigPubKey.bind(null, coinInfo.network));

  for (var _iterator = trezorOutputs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var output = _ref;
    (0, _paramsValidator.validateParams)(output, [{
      name: 'address_n',
      type: 'array'
    }, {
      name: 'address',
      type: 'string'
    }, {
      name: 'amount',
      type: 'string'
    }, {
      name: 'op_return_data',
      type: 'string'
    }, {
      name: 'multisig',
      type: 'object'
    }]);

    if (output.hasOwnProperty('address_n') && output.hasOwnProperty('address')) {
      throw new Error('Cannot use address and address_n in one output');
    }

    if (output.address_n) {
      var scriptType = (0, _pathUtils.getOutputScriptType)(output.address_n);
      if (output.script_type !== scriptType) throw new Error("Output change script_type should be set to " + scriptType);
    }

    if (typeof output.address === 'string' && !(0, _addressUtils.isValidAddress)(output.address, coinInfo)) {
      // validate address with coin info
      throw new Error("Invalid " + coinInfo.label + " output address " + output.address);
    }
  }

  return trezorOutputs;
};
/** *****
 * ComposeTransaction: validation
 *******/


exports.validateTrezorOutputs = validateTrezorOutputs;

var validateHDOutput = function validateHDOutput(output, coinInfo) {
  var validateAddress = function validateAddress(address) {
    if (!(0, _addressUtils.isValidAddress)(address, coinInfo)) {
      throw new Error("Invalid " + coinInfo.label + " output address format");
    }
  };

  switch (output.type) {
    case 'opreturn':
      (0, _paramsValidator.validateParams)(output, [{
        name: 'dataHex',
        type: 'string'
      }]);
      return {
        type: 'opreturn',
        dataHex: output.dataHex || ''
      };

    case 'send-max':
      (0, _paramsValidator.validateParams)(output, [{
        name: 'address',
        type: 'string',
        obligatory: true
      }]);
      validateAddress(output.address);
      return {
        type: 'send-max',
        address: output.address
      };

    default:
    case 'complete':
      (0, _paramsValidator.validateParams)(output, [{
        name: 'amount',
        type: 'string',
        obligatory: true
      }, {
        name: 'address',
        type: 'string',
        obligatory: true
      }]);
      validateAddress(output.address);
      return {
        type: 'complete',
        address: output.address,
        amount: output.amount
      };
  }
};
/** *****
 * Transform from hd-wallet format to Trezor
 *******/


exports.validateHDOutput = validateHDOutput;

var outputToTrezor = function outputToTrezor(output, coinInfo) {
  if (output.opReturnData) {
    if (output.hasOwnProperty('value')) {
      throw new Error('Wrong type.');
    }

    var data = output.opReturnData;
    return {
      amount: '0',
      op_return_data: data.toString('hex'),
      script_type: 'PAYTOOPRETURN'
    };
  }

  if (!output.address && !output.path) {
    throw new Error('Both address and path of an output cannot be null.');
  }

  if (output.path) {
    return {
      address_n: output.path,
      amount: output.value,
      script_type: (0, _pathUtils.getOutputScriptType)(output.path)
    };
  }

  var address = output.address,
      value = output.value;

  if (typeof address !== 'string') {
    throw new Error('Wrong address type.');
  }

  var isCashAddress = !!coinInfo.cashAddrPrefix;
  (0, _addressUtils.isScriptHash)(address, coinInfo); // make sure that cashaddr has prefix

  return {
    address: isCashAddress ? _bchaddrjs.default.toCashAddress(address) : address,
    amount: value,
    script_type: 'PAYTOADDRESS'
  };
};

exports.outputToTrezor = outputToTrezor;