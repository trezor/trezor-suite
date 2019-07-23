"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.uploadFirmware = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var trezor = _interopRequireWildcard(require("../../../types/trezor"));

// flowtype only
var uploadFirmware =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(typedCall, payload, offset, length, model) {
    var response, start, end, chunk;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            response = {};

            if (!(model === 1)) {
              _context.next = 6;
              break;
            }

            _context.next = 4;
            return typedCall('FirmwareUpload', 'Success', {
              payload: payload
            });

          case 4:
            response = _context.sent;
            return _context.abrupt("return", response.message);

          case 6:
            if (!(model === 2)) {
              _context.next = 20;
              break;
            }

            _context.next = 9;
            return typedCall('FirmwareErase', 'FirmwareRequest', {
              length: payload.byteLength
            });

          case 9:
            response = _context.sent;

          case 10:
            if (!(response.type !== 'Success')) {
              _context.next = 19;
              break;
            }

            start = response.message.offset;
            end = response.message.offset + response.message.length;
            chunk = payload.slice(start, end);
            _context.next = 16;
            return typedCall('FirmwareUpload', 'FirmwareRequest|Success', {
              payload: chunk
            });

          case 16:
            response = _context.sent;
            _context.next = 10;
            break;

          case 19:
            return _context.abrupt("return", response.message);

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function uploadFirmware(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  };
}();

exports.uploadFirmware = uploadFirmware;