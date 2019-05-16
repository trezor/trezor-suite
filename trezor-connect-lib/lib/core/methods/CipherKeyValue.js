'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var CipherKeyValue =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(CipherKeyValue, _AbstractMethod);

  function CipherKeyValue(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = ['read', 'write'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, null, _this.firmwareRange);
    _this.info = 'Cypher key value';
    _this.useEmptyPassphrase = true;
    var payload = message.payload;
    var bundledResponse = true; // create a bundle with only one batch

    if (!payload.hasOwnProperty('bundle')) {
      payload.bundle = [(0, _objectSpread2.default)({}, payload)];
      bundledResponse = false;
    } // validate bundle type


    (0, _paramsValidator.validateParams)(payload, [{
      name: 'bundle',
      type: 'array'
    }]);
    var bundle = [];
    payload.bundle.forEach(function (batch) {
      // validate incoming parameters for each batch
      (0, _paramsValidator.validateParams)(batch, [{
        name: 'path',
        obligatory: true
      }, {
        name: 'key',
        type: 'string'
      }, {
        name: 'value',
        type: 'string'
      }, {
        name: 'encrypt',
        type: 'boolean'
      }, {
        name: 'askOnEncrypt',
        type: 'boolean'
      }, {
        name: 'askOnDecrypt',
        type: 'boolean'
      }, {
        name: 'iv',
        type: 'string'
      }]);
      var path = (0, _pathUtils.validatePath)(batch.path);
      bundle.push({
        path: path,
        key: batch.key,
        value: batch.value,
        encrypt: batch.encrypt,
        askOnEncrypt: batch.askOnEncrypt,
        askOnDecrypt: batch.askOnDecrypt,
        iv: batch.iv
      });
    });
    _this.params = {
      bundle: bundle,
      bundledResponse: bundledResponse
    };
    return _this;
  }

  var _proto = CipherKeyValue.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var responses, i, batch, response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              responses = [];
              i = 0;

            case 2:
              if (!(i < this.params.bundle.length)) {
                _context.next = 12;
                break;
              }

              batch = this.params.bundle[i];
              _context.next = 6;
              return this.device.getCommands().cipherKeyValue(batch.path, batch.key, batch.value, batch.encrypt, batch.askOnEncrypt, batch.askOnDecrypt, batch.iv);

            case 6:
              response = _context.sent;
              responses.push(response);

              if (this.params.bundledResponse) {
                // send progress
                this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
                  progress: i,
                  response: response
                }));
              }

            case 9:
              i++;
              _context.next = 2;
              break;

            case 12:
              return _context.abrupt("return", this.params.bundledResponse ? responses : responses[0]);

            case 13:
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

  return CipherKeyValue;
}(_AbstractMethod2.default);

exports.default = CipherKeyValue;