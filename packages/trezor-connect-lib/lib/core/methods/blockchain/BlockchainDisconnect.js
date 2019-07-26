"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

var BLOCKCHAIN = _interopRequireWildcard(require("../../../constants/blockchain"));

var _errors = require("../../../constants/errors");

var _backend = require("../../../backend");

var _BlockchainLink = require("../../../backend/BlockchainLink");

var _CoinInfo = require("../../../data/CoinInfo");

var _builder = require("../../../message/builder");

var BlockchainDisconnect =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(BlockchainDisconnect, _AbstractMethod);

  function BlockchainDisconnect(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = [];
    _this.info = '';
    _this.useDevice = false;
    _this.useUi = false;
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    var coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);

    if (!coinInfo) {
      coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);
    }

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    _this.params = {
      coinInfo: coinInfo
    };
    return _this;
  }

  var _proto = BlockchainDisconnect.prototype;

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
              return this.disconnectBlockchain();

            case 3:
              return _context.abrupt("return", _context.sent);

            case 6:
              _context.next = 8;
              return this.disconnectBlockbook();

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

  _proto.disconnectBlockchain =
  /*#__PURE__*/
  function () {
    var _disconnectBlockchain = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var backend;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _BlockchainLink.find)(this.params.coinInfo.name);

            case 2:
              backend = _context2.sent;

              if (backend) {
                backend.disconnect();
              }

              return _context2.abrupt("return", {
                disconnected: true
              });

            case 5:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function disconnectBlockchain() {
      return _disconnectBlockchain.apply(this, arguments);
    }

    return disconnectBlockchain;
  }();

  _proto.disconnectBlockbook =
  /*#__PURE__*/
  function () {
    var _disconnectBlockbook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      var backend;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return (0, _backend.find)(this.params.coinInfo.name);

            case 2:
              backend = _context3.sent;

              if (backend) {
                backend.blockchain.destroy();

                backend._setError(new Error('manual disconnect'));

                this.postMessage(new _builder.BlockchainMessage(BLOCKCHAIN.ERROR, {
                  coin: this.params.coinInfo,
                  error: 'manual disconnect'
                }));
              }

              return _context3.abrupt("return", {
                disconnected: true
              });

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function disconnectBlockbook() {
      return _disconnectBlockbook.apply(this, arguments);
    }

    return disconnectBlockbook;
  }();

  return BlockchainDisconnect;
}(_AbstractMethod2.default);

exports.default = BlockchainDisconnect;