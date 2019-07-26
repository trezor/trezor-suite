'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.resolveAfter = resolveAfter;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _es6Promise = _interopRequireDefault(require("es6-promise"));

function resolveAfter(_x, _x2) {
  return _resolveAfter.apply(this, arguments);
}

function _resolveAfter() {
  _resolveAfter = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(msec, value) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new _es6Promise.default(function (resolve) {
              setTimeout(resolve, msec, value);
            });

          case 2:
            return _context.abrupt("return", _context.sent);

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _resolveAfter.apply(this, arguments);
}