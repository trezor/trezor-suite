'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var RippleSignTransaction =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(RippleSignTransaction, _AbstractMethod);

  function RippleSignTransaction(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, (0, _CoinInfo.getMiscNetwork)('Ripple'), _this.firmwareRange);
    _this.info = 'Sign Ripple transaction';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    var path = (0, _pathUtils.validatePath)(payload.path, 5); // incoming data should be in ripple-sdk format

    var transaction = payload.transaction;
    (0, _paramsValidator.validateParams)(transaction, [{
      name: 'fee',
      type: 'string'
    }, {
      name: 'flags',
      type: 'number'
    }, {
      name: 'sequence',
      type: 'number'
    }, {
      name: 'maxLedgerVersion',
      type: 'number'
    }, {
      name: 'payment',
      type: 'object'
    }]);
    (0, _paramsValidator.validateParams)(transaction.payment, [{
      name: 'amount',
      type: 'string',
      obligatory: true
    }, {
      name: 'destination',
      type: 'string',
      obligatory: true
    }, {
      name: 'destinationTag',
      type: 'number'
    }]);
    _this.params = {
      path: path,
      transaction: transaction
    };
    return _this;
  }

  var _proto = RippleSignTransaction.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var tx, response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              tx = this.params.transaction;
              _context.next = 3;
              return this.device.getCommands().rippleSignTx({
                address_n: this.params.path,
                fee: parseInt(tx.fee),
                flags: tx.flags,
                sequence: tx.sequence,
                last_ledger_sequence: tx.maxLedgerVersion,
                payment: {
                  amount: parseInt(tx.payment.amount),
                  destination: tx.payment.destination,
                  destination_tag: tx.payment.destinationTag
                }
              });

            case 3:
              response = _context.sent;
              return _context.abrupt("return", {
                serializedTx: response.serialized_tx,
                signature: response.signature
              });

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  return RippleSignTransaction;
}(_AbstractMethod2.default);

exports.default = RippleSignTransaction;