'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.cardanoSignTx = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var processTxRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(typedCall, request, transactions) {
    var transaction, response, _response;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            transaction = transactions[request.tx_index];

            if (!(request.tx_index < transactions.length - 1)) {
              _context.next = 8;
              break;
            }

            _context.next = 4;
            return typedCall('CardanoTxAck', 'CardanoTxRequest', {
              transaction: transaction
            });

          case 4:
            response = _context.sent;
            return _context.abrupt("return", processTxRequest(typedCall, response.message, transactions));

          case 8:
            _context.next = 10;
            return typedCall('CardanoTxAck', 'CardanoSignedTx', {
              transaction: transaction
            });

          case 10:
            _response = _context.sent;
            return _context.abrupt("return", _response.message);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function processTxRequest(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var cardanoSignTx =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(typedCall, inputs, outputs, transactions, protocol_magic) {
    var response;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return typedCall('CardanoSignTx', 'CardanoTxRequest', {
              inputs: inputs,
              outputs: outputs,
              transactions_count: transactions.length,
              protocol_magic: protocol_magic
            });

          case 2:
            response = _context2.sent;
            _context2.next = 5;
            return processTxRequest(typedCall, response.message, transactions);

          case 5:
            return _context2.abrupt("return", _context2.sent);

          case 6:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function cardanoSignTx(_x4, _x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();

exports.cardanoSignTx = cardanoSignTx;