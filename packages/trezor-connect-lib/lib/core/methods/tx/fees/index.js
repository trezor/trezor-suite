"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getBlocks = exports.getActualFee = exports.getFeeLevels = exports.init = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _legacy = require("./legacy");

var _smart = require("./smart");

var _preloaded = require("./preloaded");

var _backend = _interopRequireDefault(require("../../../../backend"));

var feeHandler = null;
var handlers = [_smart.smartBitcoreHandler, _legacy.legacyBitcoreHandler, _preloaded.preloadedHandler];

var findWorkingHandler =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(backend, coinInfo) {
    var _i, handler;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _i = 0;

          case 1:
            if (!(_i < handlers.length)) {
              _context.next = 11;
              break;
            }

            handler = handlers[_i];
            _context.next = 5;
            return handler.detectWorking(backend, coinInfo);

          case 5:
            if (!_context.sent) {
              _context.next = 8;
              break;
            }

            handler.getFeeList().forEach(function (level) {// level.refreshHack = 0;
            });
            return _context.abrupt("return", handler);

          case 8:
            _i++;
            _context.next = 1;
            break;

          case 11:
            throw new Error('No handler working');

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function findWorkingHandler(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var init =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(backend, coinInfo) {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return findWorkingHandler(backend, coinInfo);

          case 2:
            feeHandler = _context2.sent;

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function init(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

exports.init = init;

var getFeeLevels = function getFeeLevels() {
  if (feeHandler == null) {
    return [];
  }

  return feeHandler.getFeeList();
};

exports.getFeeLevels = getFeeLevels;

var getActualFee = function getActualFee(level, coinInfo) {
  if (feeHandler == null) {
    throw new Error('No fee hander');
  }

  var info = level.info;

  if (info.type === 'custom') {
    if (!/^\d+$/.test(info.fee)) {
      throw new Error('');
    }

    if (+info.fee < coinInfo.minFee) {
      throw new Error('');
    }

    return info.fee;
  }

  return feeHandler.getFee(info);
};

exports.getActualFee = getActualFee;

var getBlocks = function getBlocks(fee) {
  if (feeHandler == null) {
    throw new Error('');
  }

  return feeHandler.getBlocks(fee);
};

exports.getBlocks = getBlocks;