"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getOrigin = exports.httpRequest = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var httpRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(url, type) {
    var fileUrl, content;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            fileUrl = url.split('?')[0];
            fileUrl = _path.default.resolve(__dirname, '../../', fileUrl);
            content = type !== 'binary' ? _fs.default.readFileSync(fileUrl, {
              encoding: 'utf8'
            }) : _fs.default.readFileSync(fileUrl);

            if (content) {
              _context.next = 5;
              break;
            }

            return _context.abrupt("return", null);

          case 5:
            if (!(type === 'binary')) {
              _context.next = 9;
              break;
            }

            return _context.abrupt("return", Array.from(content));

          case 9:
            if (!(type === 'json' && typeof content === 'string')) {
              _context.next = 11;
              break;
            }

            return _context.abrupt("return", JSON.parse(content));

          case 11:
            return _context.abrupt("return", content);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function httpRequest(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.httpRequest = httpRequest;

var getOrigin = function getOrigin(url) {
  if (url.indexOf('file://') === 0) return 'file://'; // eslint-disable-next-line no-irregular-whitespace, no-useless-escape

  var parts = url.match(/^.+\:\/\/[^\/]+/);
  return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};

exports.getOrigin = getOrigin;