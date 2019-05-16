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

var _errors = require("../../constants/errors");

var _backend = require("../../backend");

var _BlockchainLink = require("../../backend/BlockchainLink");

var PushTransaction =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(PushTransaction, _AbstractMethod);

  function PushTransaction(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = [];
    _this.useUi = false;
    _this.useDevice = false;
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'tx',
      type: 'string',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    var coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    if (coinInfo.type === 'bitcoin' && !/^[0-9A-Fa-f]*$/.test(payload.tx)) {
      throw new Error('Invalid params: Transaction must be hexadecimal');
    }

    _this.params = {
      tx: payload.tx,
      coinInfo: coinInfo
    };
    return _this;
  }

  var _proto = PushTransaction.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(this.params.coinInfo.type === 'misc')) {
                _context.next = 6;
                break;
              }

              _context.next = 3;
              return this.pushBlockchain();

            case 3:
              return _context.abrupt("return", _context.sent);

            case 6:
              _context.next = 8;
              return this.pushBlockbook();

            case 8:
              return _context.abrupt("return", _context.sent);

            case 9:
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

  _proto.pushBlockchain =
  /*#__PURE__*/
  function () {
    var _pushBlockchain = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var backend, txid;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _BlockchainLink.create)(this.params.coinInfo, this.postMessage);

            case 2:
              backend = _context2.sent;
              _context2.next = 5;
              return backend.pushTransaction(this.params.tx);

            case 5:
              txid = _context2.sent;
              return _context2.abrupt("return", {
                txid: txid
              });

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function pushBlockchain() {
      return _pushBlockchain.apply(this, arguments);
    }

    return pushBlockchain;
  }();

  _proto.pushBlockbook =
  /*#__PURE__*/
  function () {
    var _pushBlockbook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      var coinInfo, backend, txid;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              coinInfo = this.params.coinInfo;

              if (!(coinInfo.type === 'misc')) {
                _context3.next = 3;
                break;
              }

              throw new Error('Invalid CoinInfo object');

            case 3:
              _context3.next = 5;
              return (0, _backend.create)(coinInfo);

            case 5:
              backend = _context3.sent;
              _context3.next = 8;
              return backend.sendTransactionHex(this.params.tx);

            case 8:
              txid = _context3.sent;
              return _context3.abrupt("return", {
                txid: txid
              });

            case 10:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function pushBlockbook() {
      return _pushBlockbook.apply(this, arguments);
    }

    return pushBlockbook;
  }();

  return PushTransaction;
}(_AbstractMethod2.default);

exports.default = PushTransaction;