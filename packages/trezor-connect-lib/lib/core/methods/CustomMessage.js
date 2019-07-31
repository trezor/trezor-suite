'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var CustomMessage =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(CustomMessage, _AbstractMethod);

  function CustomMessage(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['custom-message', 'read', 'write'];
    _this.info = 'Custom message';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(message.payload, [{
      name: 'message',
      type: 'string',
      obligatory: true
    }, {
      name: 'params',
      type: 'object',
      obligatory: true
    }]);

    if (payload.hasOwnProperty('messages')) {
      try {
        JSON.parse(JSON.stringify(payload.messages));
      } catch (error) {
        throw new Error('Parameter "messages" has invalid type. JSON expected.');
      }
    }

    _this.params = {
      customMessages: payload.messages,
      message: payload.message,
      params: payload.params
    };
    return _this;
  }

  var _proto = CustomMessage.prototype;

  _proto.getCustomMessages = function getCustomMessages() {
    return this.params.customMessages;
  };

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var response, uiResp, payload;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(this.device.features.vendor === 'trezor.io' || this.device.features.vendor === 'bitcointrezor.com')) {
                _context.next = 2;
                break;
              }

              throw new Error('Cannot use custom message on device with official firmware. Change device "vendor" field.');

            case 2:
              _context.next = 4;
              return this.device.getCommands()._commonCall(this.params.message, this.params.params);

            case 4:
              response = _context.sent;
              // send result to developer
              this.postMessage(new _builder.UiMessage(UI.CUSTOM_MESSAGE_REQUEST, response)); // wait for response from developer

              _context.next = 8;
              return this.createUiPromise(UI.CUSTOM_MESSAGE_RESPONSE, this.device).promise;

            case 8:
              uiResp = _context.sent;
              payload = uiResp.payload; // validate incoming response

              (0, _paramsValidator.validateParams)(payload, [{
                name: 'message',
                type: 'string',
                obligatory: true
              }]);

              if (!(payload.message.toLowerCase() === 'release')) {
                _context.next = 15;
                break;
              }

              return _context.abrupt("return", response);

            case 15:
              // validate incoming parameters
              (0, _paramsValidator.validateParams)(payload, [{
                name: 'params',
                type: 'object',
                obligatory: true
              }]); // change local params and make another call to device

              this.params.message = payload.message;
              this.params.params = payload.params;
              _context.next = 20;
              return this.run();

            case 20:
              return _context.abrupt("return", _context.sent);

            case 21:
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

  return CustomMessage;
}(_AbstractMethod2.default);

exports.default = CustomMessage;