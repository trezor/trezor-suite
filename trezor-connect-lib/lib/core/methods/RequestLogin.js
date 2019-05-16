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

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var RequestLogin =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(RequestLogin, _AbstractMethod);

  function RequestLogin(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, null, _this.firmwareRange);
    _this.info = 'Login';
    _this.useEmptyPassphrase = true;
    var payload = message.payload;
    var identity = {};

    var settings = _DataManager.default.getSettings();

    if (settings.origin) {
      var uri = settings.origin.split(':');
      identity.proto = uri[0];
      identity.host = uri[1].substring(2);

      if (uri[2]) {
        identity.port = uri[2];
      }

      identity.index = 0;
    } // validate incoming parameters


    (0, _paramsValidator.validateParams)(payload, [{
      name: 'challengeHidden',
      type: 'string'
    }, {
      name: 'challengeVisual',
      type: 'string'
    }, {
      name: 'asyncChallenge',
      type: 'boolean'
    }]);
    _this.params = {
      asyncChallenge: payload.asyncChallenge,
      identity: identity,
      challengeHidden: payload.challengeHidden || '',
      challengeVisual: payload.challengeVisual || ''
    };
    return _this;
  }

  var _proto = RequestLogin.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var uiResp, payload, response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!this.params.asyncChallenge) {
                _context.next = 11;
                break;
              }

              // send request to developer
              this.postMessage(new _builder.UiMessage(UI.LOGIN_CHALLENGE_REQUEST)); // wait for response from developer

              _context.next = 4;
              return this.createUiPromise(UI.LOGIN_CHALLENGE_RESPONSE, this.device).promise;

            case 4:
              uiResp = _context.sent;
              payload = uiResp.payload; // error handler

              if (!(typeof payload === 'string')) {
                _context.next = 8;
                break;
              }

              throw new Error("TrezorConnect.requestLogin callback error: " + payload);

            case 8:
              // validate incoming parameters
              (0, _paramsValidator.validateParams)(payload, [{
                name: 'challengeHidden',
                type: 'string',
                obligatory: true
              }, {
                name: 'challengeVisual',
                type: 'string',
                obligatory: true
              }]);
              this.params.challengeHidden = payload.challengeHidden;
              this.params.challengeVisual = payload.challengeVisual;

            case 11:
              _context.next = 13;
              return this.device.getCommands().signIdentity(this.params.identity, this.params.challengeHidden, this.params.challengeVisual);

            case 13:
              response = _context.sent;
              return _context.abrupt("return", {
                address: response.address,
                publicKey: response.public_key,
                signature: response.signature
              });

            case 15:
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

  return RequestLogin;
}(_AbstractMethod2.default);

exports.default = RequestLogin;