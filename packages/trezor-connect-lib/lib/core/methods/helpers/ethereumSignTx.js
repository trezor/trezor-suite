'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.ethereumSignTx = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var splitString = function splitString(str, len) {
  if (str == null) {
    return ['', ''];
  }

  var first = str.slice(0, len);
  var second = str.slice(len);
  return [first, second];
};

var processTxRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(typedCall, request, data, chain_id) {
    var v, r, s, _splitString, first, rest, response;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (request.data_length) {
              _context.next = 8;
              break;
            }

            v = request.signature_v;
            r = request.signature_r;
            s = request.signature_s;

            if (!(v == null || r == null || s == null)) {
              _context.next = 6;
              break;
            }

            throw new Error('Unexpected request.');

          case 6:
            // recompute "v" value
            // from: https://github.com/kvhnuke/etherwallet/commit/288bd35497e00ad3947e9d11f60154bae1bf3c2f
            if (chain_id && v <= 1) {
              v += 2 * chain_id + 35;
            }

            return _context.abrupt("return", Promise.resolve({
              v: '0x' + v.toString(16),
              r: '0x' + r,
              s: '0x' + s
            }));

          case 8:
            _splitString = splitString(data, request.data_length * 2), first = _splitString[0], rest = _splitString[1];
            _context.next = 11;
            return typedCall('EthereumTxAck', 'EthereumTxRequest', {
              data_chunk: first
            });

          case 11:
            response = _context.sent;
            _context.next = 14;
            return processTxRequest(typedCall, response.message, rest, chain_id);

          case 14:
            return _context.abrupt("return", _context.sent);

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function processTxRequest(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

function stripLeadingZeroes(str) {
  while (/^00/.test(str)) {
    str = str.slice(2);
  }

  return str;
}

var ethereumSignTx =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(typedCall, address_n, to, value, gas_limit, gas_price, nonce, data, chain_id, tx_type) {
    var length, _splitString2, first, rest, message, response;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            length = data == null ? 0 : data.length / 2;
            _splitString2 = splitString(data, 1024 * 2), first = _splitString2[0], rest = _splitString2[1];
            message = {
              address_n: address_n,
              nonce: stripLeadingZeroes(nonce),
              gas_price: stripLeadingZeroes(gas_price),
              gas_limit: stripLeadingZeroes(gas_limit),
              to: to,
              value: stripLeadingZeroes(value)
            };

            if (length !== 0) {
              message = (0, _objectSpread2.default)({}, message, {
                data_length: length,
                data_initial_chunk: first
              });
            }

            if (chain_id) {
              message = (0, _objectSpread2.default)({}, message, {
                chain_id: chain_id
              });
            }

            if (tx_type !== null) {
              message = (0, _objectSpread2.default)({}, message, {
                tx_type: tx_type
              });
            }

            _context2.next = 8;
            return typedCall('EthereumSignTx', 'EthereumTxRequest', message);

          case 8:
            response = _context2.sent;
            _context2.next = 11;
            return processTxRequest(typedCall, response.message, rest, chain_id);

          case 11:
            return _context2.abrupt("return", _context2.sent);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function ethereumSignTx(_x5, _x6, _x7, _x8, _x9, _x10, _x11, _x12, _x13, _x14) {
    return _ref2.apply(this, arguments);
  };
}();

exports.ethereumSignTx = ethereumSignTx;