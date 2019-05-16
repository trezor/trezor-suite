"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("../AbstractMethod"));

var DebugLinkGetState =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(DebugLinkGetState, _AbstractMethod);

  function DebugLinkGetState(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.useDevice = true;
    _this.debugLink = true;
    _this.useUi = false;
    return _this;
  }

  var _proto = DebugLinkGetState.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (this.device.hasDebugLink) {
                _context.next = 2;
                break;
              }

              throw new Error('Device is not a debug link');

            case 2:
              _context.next = 4;
              return this.device.getCommands().debugLinkGetState();

            case 4:
              response = _context.sent;
              return _context.abrupt("return", (0, _objectSpread2.default)({
                debugLink: true
              }, response));

            case 6:
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

  return DebugLinkGetState;
}(_AbstractMethod2.default);

exports.default = DebugLinkGetState;