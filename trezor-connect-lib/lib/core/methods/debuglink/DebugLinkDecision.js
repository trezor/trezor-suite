"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

var DebugLinkDecision =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(DebugLinkDecision, _AbstractMethod);

  function DebugLinkDecision(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.useDevice = true;
    _this.debugLink = true;
    _this.useUi = false;
    var payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'yes_no',
      type: 'boolean'
    }, {
      name: 'up_down',
      type: 'boolean'
    }, {
      name: 'input',
      type: 'string'
    }]);
    _this.params = {
      yes_no: payload.yes_no,
      up_down: payload.up_down,
      input: payload.input
    };
    return _this;
  }

  var _proto = DebugLinkDecision.prototype;

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
              if (this.device.hasDebugLink) {
                _context.next = 2;
                break;
              }

              throw new Error('Device is not a debug link');

            case 2:
              if (this.device.isUsedHere()) {
                _context.next = 4;
                break;
              }

              throw new Error('Device is not acquired!');

            case 4:
              _context.next = 6;
              return this.device.getCommands().debugLinkDecision(this.params);

            case 6:
              return _context.abrupt("return", {
                debugLink: true
              });

            case 7:
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

  return DebugLinkDecision;
}(_AbstractMethod2.default);

exports.default = DebugLinkDecision;