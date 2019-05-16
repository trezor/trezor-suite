"use strict";

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

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _ethereumUtils = require("../../utils/ethereumUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _lodash = require("lodash");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var EthereumGetPublicKey =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(EthereumGetPublicKey, _AbstractMethod);

  function EthereumGetPublicKey(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = ['read']; // create a bundle with only one batch if bundle doesn't exists

    var payload = !message.payload.hasOwnProperty('bundle') ? (0, _objectSpread2.default)({}, message.payload, {
      bundle: [].concat(message.payload)
    }) : message.payload; // validate bundle type

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
      var network = (0, _CoinInfo.getEthereumNetwork)(path);
      _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, network, _this.firmwareRange);
      var showOnTrezor = false;

      if (batch.hasOwnProperty('showOnTrezor')) {
        showOnTrezor = batch.showOnTrezor;
      }

      bundle.push({
        path: path,
        network: network,
        showOnTrezor: showOnTrezor
      });
    });
    _this.params = bundle; // set info

    if (bundle.length === 1) {
      _this.info = (0, _ethereumUtils.getNetworkLabel)('Export #NETWORK public key', bundle[0].network);
    } else {
      var requestedNetworks = bundle.map(function (b) {
        return b.network;
      });
      var uniqNetworks = (0, _lodash.uniq)(requestedNetworks);

      if (uniqNetworks.length === 1 && uniqNetworks[0]) {
        _this.info = (0, _ethereumUtils.getNetworkLabel)('Export multiple #NETWORK public keys', uniqNetworks[0]);
      } else {
        _this.info = 'Export multiple public keys';
      }
    }

    return _this;
  }

  var _proto = EthereumGetPublicKey.prototype;

  _proto.confirmation =
  /*#__PURE__*/
  function () {
    var _confirmation = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var uiPromise, uiResp;
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
              uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

              this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
                label: this.info
              })); // wait for user action

              _context.next = 8;
              return uiPromise.promise;

            case 8:
              uiResp = _context.sent;
              this.confirmed = uiResp.payload;
              return _context.abrupt("return", this.confirmed);

            case 11:
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
      var responses, bundledResponse, i, batch, response;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              responses = [];
              bundledResponse = this.params.length > 1;
              i = 0;

            case 3:
              if (!(i < this.params.length)) {
                _context2.next = 13;
                break;
              }

              batch = this.params[i];
              _context2.next = 7;
              return this.device.getCommands().ethereumGetPublicKey(batch.path, batch.showOnTrezor);

            case 7:
              response = _context2.sent;
              responses.push(response);

              if (bundledResponse) {
                // send progress
                this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
                  progress: i,
                  response: response
                }));
              }

            case 10:
              i++;
              _context2.next = 3;
              break;

            case 13:
              return _context2.abrupt("return", bundledResponse ? responses : responses[0]);

            case 14:
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

  return EthereumGetPublicKey;
}(_AbstractMethod2.default);

exports.default = EthereumGetPublicKey;