'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var LiskGetPublicKey =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(LiskGetPublicKey, _AbstractMethod);

  function LiskGetPublicKey(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = ['read'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), _this.firmwareRange);
    _this.info = 'Export Lisk public key';
    var payload = message.payload;
    var bundledResponse = true; // create a bundle with only one batch

    if (!payload.hasOwnProperty('bundle')) {
      payload.bundle = [].concat(payload);
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
        name: 'showOnTrezor',
        type: 'boolean'
      }]);
      var path = (0, _pathUtils.validatePath)(batch.path, 3);
      var showOnTrezor = false;

      if (batch.hasOwnProperty('showOnTrezor')) {
        showOnTrezor = batch.showOnTrezor;
      }

      bundle.push({
        path: path,
        showOnTrezor: showOnTrezor
      });
    });
    _this.params = {
      bundle: bundle,
      bundledResponse: bundledResponse
    };
    return _this;
  }

  var _proto = LiskGetPublicKey.prototype;

  _proto.confirmation =
  /*#__PURE__*/
  function () {
    var _confirmation = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var uiPromise, label, uiResp;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!this.confirmed) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return", true);

            case 2:
              _context.next = 4;
              return this.getPopupPromise().promise;

            case 4:
              // initialize user response promise
              uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);

              if (this.params.bundle.length > 1) {
                label = 'Export multiple Lisk public keys';
              } else {
                label = "Export Lisk public key for account #" + ((0, _pathUtils.fromHardened)(this.params.bundle[0].path[2]) + 1);
              } // request confirmation view


              this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
                label: label
              })); // wait for user action

              _context.next = 9;
              return uiPromise.promise;

            case 9:
              uiResp = _context.sent;
              this.confirmed = uiResp.payload;
              return _context.abrupt("return", this.confirmed);

            case 12:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function confirmation() {
      return _confirmation.apply(this, arguments);
    }

    return confirmation;
  }();

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var responses, i, response;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              responses = [];
              i = 0;

            case 2:
              if (!(i < this.params.bundle.length)) {
                _context2.next = 11;
                break;
              }

              _context2.next = 5;
              return this.device.getCommands().liskGetPublicKey(this.params.bundle[i].path, this.params.bundle[i].showOnTrezor);

            case 5:
              response = _context2.sent;
              responses.push({
                publicKey: response.public_key,
                path: this.params.bundle[i].path,
                serializedPath: (0, _pathUtils.getSerializedPath)(this.params.bundle[i].path)
              });

              if (this.params.bundledResponse) {
                // send progress
                this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
                  progress: i,
                  response: response
                }));
              }

            case 8:
              i++;
              _context2.next = 2;
              break;

            case 11:
              return _context2.abrupt("return", this.params.bundledResponse ? responses : responses[0]);

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  return LiskGetPublicKey;
}(_AbstractMethod2.default);

exports.default = LiskGetPublicKey;