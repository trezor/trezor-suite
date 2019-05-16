"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var requestPrevTxInfo = function requestPrevTxInfo(reqTx, requestType, requestIndex, dataLen, dataOffset) {
  var i = +requestIndex;

  if (requestType === 'TXINPUT') {
    return {
      inputs: [reqTx.inputs[i]]
    };
  }

  if (requestType === 'TXOUTPUT') {
    return {
      bin_outputs: [reqTx.bin_outputs[i]]
    };
  }

  if (requestType === 'TXEXTRADATA') {
    if (dataLen == null) {
      throw new Error('Missing extra_data_len');
    }

    var dataLenN = +dataLen;

    if (dataOffset == null) {
      throw new Error('Missing extra_data_offset');
    }

    var dataOffsetN = +dataOffset;

    if (reqTx.extra_data == null) {
      throw new Error('No extra data for transaction ' + reqTx.hash);
    }

    var data = reqTx.extra_data;
    var substring = data.substring(dataOffsetN * 2, (dataOffsetN + dataLenN) * 2);
    return {
      extra_data: substring
    };
  }

  if (requestType === 'TXMETA') {
    var outputCount = reqTx.bin_outputs.length;
    var _data = reqTx.extra_data;
    var meta = {
      version: reqTx.version,
      lock_time: reqTx.lock_time,
      inputs_cnt: reqTx.inputs.length,
      outputs_cnt: outputCount,
      timestamp: reqTx.timestamp,
      version_group_id: reqTx.version_group_id
    };

    if (typeof _data === 'string' && _data.length !== 0) {
      return (0, _objectSpread2.default)({}, meta, {
        extra_data_len: _data.length / 2
      });
    }

    return meta;
  }

  throw new Error("Unknown request type: " + requestType);
};

var requestSignedTxInfo = function requestSignedTxInfo(inputs, outputs, requestType, requestIndex) {
  var i = +requestIndex;

  if (requestType === 'TXINPUT') {
    return {
      inputs: [inputs[i]]
    };
  }

  if (requestType === 'TXOUTPUT') {
    return {
      outputs: [outputs[i]]
    };
  }

  if (requestType === 'TXMETA') {
    throw new Error('Cannot read TXMETA from signed transaction');
  }

  if (requestType === 'TXEXTRADATA') {
    throw new Error('Cannot read TXEXTRADATA from signed transaction');
  }

  throw new Error("Unknown request type: " + requestType);
}; // requests information about a transaction
// can be either signed transaction iteslf of prev transaction


var requestTxInfo = function requestTxInfo(m, index, inputs, outputs) {
  var md = m.details;
  var hash = md.tx_hash;

  if (hash) {
    var reqTx = index[hash.toLowerCase()];

    if (!reqTx) {
      throw new Error("Requested unknown tx: " + hash);
    }

    return requestPrevTxInfo(reqTx, m.request_type, md.request_index, md.extra_data_len, md.extra_data_offset);
  } else {
    return requestSignedTxInfo(inputs, outputs, m.request_type, md.request_index);
  }
};

var saveTxSignatures = function saveTxSignatures(ms, serializedTx, signatures) {
  if (ms) {
    var _signatureIndex = ms.signature_index;
    var _signature = ms.signature;
    var _serializedTx = ms.serialized_tx;

    if (_serializedTx != null) {
      serializedTx.serialized += _serializedTx;
    }

    if (_signatureIndex != null) {
      if (_signature == null) {
        throw new Error('Unexpected null in trezor:TxRequestSerialized signature.');
      }

      signatures[_signatureIndex] = _signature;
    }
  }
};

var processTxRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(typedCall, m, serializedTx, signatures, index, inputs, outputs) {
    var resTx, response;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            saveTxSignatures(m.serialized, serializedTx, signatures);

            if (!(m.request_type === 'TXFINISHED')) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return", Promise.resolve({
              signatures: signatures,
              serializedTx: serializedTx.serialized
            }));

          case 3:
            resTx = requestTxInfo(m, index, inputs, outputs);
            _context.next = 6;
            return typedCall('TxAck', 'TxRequest', {
              tx: resTx
            });

          case 6:
            response = _context.sent;
            _context.next = 9;
            return processTxRequest(typedCall, response.message, serializedTx, signatures, index, inputs, outputs);

          case 9:
            return _context.abrupt("return", _context.sent);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function processTxRequest(_x, _x2, _x3, _x4, _x5, _x6, _x7) {
    return _ref.apply(this, arguments);
  };
}();

var _default =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(typedCall, inputs, outputs, refTxs, options, coinInfo) {
    var index, signatures, serializedTx, response, signed;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            index = {};
            refTxs.forEach(function (tx) {
              index[tx.hash.toLowerCase()] = tx;
            });
            signatures = [];
            serializedTx = {
              serialized: ''
            };
            _context2.next = 6;
            return typedCall('SignTx', 'TxRequest', (0, _objectSpread2.default)({
              inputs_count: inputs.length,
              outputs_count: outputs.length,
              coin_name: coinInfo.name
            }, options));

          case 6:
            response = _context2.sent;
            _context2.next = 9;
            return processTxRequest(typedCall, response.message, serializedTx, signatures, index, inputs, outputs);

          case 9:
            signed = _context2.sent;
            return _context2.abrupt("return", signed);

          case 11:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x8, _x9, _x10, _x11, _x12, _x13) {
    return _ref2.apply(this, arguments);
  };
}();

exports.default = _default;