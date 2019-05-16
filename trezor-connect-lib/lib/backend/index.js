'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = exports.create = exports.find = exports.remove = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _BlockBook = _interopRequireDefault(require("./BlockBook"));

var instances = [];

var remove = function remove(backend) {
  var index = instances.indexOf(backend);

  if (index >= 0) {
    instances.splice(index, 1);
  }
};

exports.remove = remove;

var find = function find(name) {
  for (var i = 0; i < instances.length; i++) {
    if (instances[i].options.coinInfo.name === name) {
      if (instances[i].error) {
        remove(instances[i]);
      } else {
        return instances[i];
      }
    }
  }

  return null;
};

exports.find = find;

var create =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(coinInfo) {
    var backend;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            backend = find(coinInfo.name);

            if (backend) {
              _context.next = 13;
              break;
            }

            backend = new _BlockBook.default({
              urls: [].concat(coinInfo.blockbook, coinInfo.bitcore),
              coinInfo: coinInfo
            });
            _context.prev = 3;
            _context.next = 6;
            return backend.loadCoinInfo(coinInfo);

          case 6:
            _context.next = 12;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](3);
            remove(backend);
            throw _context.t0;

          case 12:
            instances.push(backend);

          case 13:
            return _context.abrupt("return", backend);

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[3, 8]]);
  }));

  return function create(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.create = create;
var _default = _BlockBook.default;
exports.default = _default;