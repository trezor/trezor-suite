"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.preloadedHandler = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _backend = _interopRequireDefault(require("../../../../backend"));

var feeLevels = [];

function detectWorking(_x, _x2) {
  return _detectWorking.apply(this, arguments);
}

function _detectWorking() {
  _detectWorking = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(backend, coinInfo) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            feeLevels = Object.keys(coinInfo.defaultFees).sort(function (levelA, levelB) {
              return coinInfo.defaultFees[levelB] - coinInfo.defaultFees[levelA];
            }).map(function (level, i) {
              return {
                name: level.toLowerCase(),
                id: i,
                info: {
                  type: 'preloaded',
                  fee: coinInfo.defaultFees[level].toString()
                }
              };
            });
            return _context.abrupt("return", feeLevels.length > 0);

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _detectWorking.apply(this, arguments);
}

function refresh() {
  return _refresh.apply(this, arguments);
}

function _refresh() {
  _refresh = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", true);

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _refresh.apply(this, arguments);
}

function getFeeList() {
  return feeLevels;
}

function getFee(level) {
  if (level.type === 'preloaded') {
    return level.fee;
  }

  throw new Error('Wrong level type');
}

function getBlocks(fee) {
  return null;
}

var preloadedHandler = {
  refresh: refresh,
  detectWorking: detectWorking,
  getFeeList: getFeeList,
  getFee: getFee,
  getBlocks: getBlocks
};
exports.preloadedHandler = preloadedHandler;