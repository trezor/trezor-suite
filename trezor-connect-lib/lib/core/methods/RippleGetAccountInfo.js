"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _errors = require("../../constants/errors");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _BlockchainLink = require("../../backend/BlockchainLink");

var RippleGetAccountInfo =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(RippleGetAccountInfo, _AbstractMethod);

  function RippleGetAccountInfo(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = ['read'];
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, (0, _CoinInfo.getMiscNetwork)('Ripple'), _this.firmwareRange);
    _this.info = 'Export ripple account info';
    _this.useDevice = true;
    _this.useUi = false;
    var payload = message.payload;
    var bundledResponse = true;
    var willUseDevice = false; // create a bundle with only one batch

    if (!payload.hasOwnProperty('bundle')) {
      payload.bundle = [].concat(payload.account);
      bundledResponse = false;
    } // validate incoming parameters


    (0, _paramsValidator.validateParams)(payload, [{
      name: 'bundle',
      type: 'array',
      obligatory: true
    }, {
      name: 'level',
      type: 'string'
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    payload.bundle.forEach(function (batch) {
      (0, _paramsValidator.validateParams)(batch, [{
        name: 'descriptor',
        type: 'string'
      }, {
        name: 'path',
        type: 'string'
      }, {
        name: 'block',
        type: 'number'
      }, {
        name: 'transactions',
        type: 'number'
      }, {
        name: 'mempool',
        type: 'boolean'
      }, {
        name: 'history',
        type: 'boolean'
      }]);

      if (!batch.path && !batch.descriptor) {
        throw new Error('"path" or "descriptor" field is missing in account');
      } // validate path if exists


      if (batch.path) {
        batch.path = (0, _pathUtils.validatePath)(batch.path, 5);
        willUseDevice = true;
      }
    });
    var network = (0, _CoinInfo.getMiscNetwork)(payload.coin);

    if (!network) {
      throw _errors.NO_COIN_INFO;
    }

    _this.useDevice = willUseDevice;
    _this.params = {
      accounts: payload.bundle,
      level: payload.level,
      coinInfo: network,
      bundledResponse: bundledResponse
    };
    return _this;
  }

  var _proto = RippleGetAccountInfo.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var blockchain, responses, i, account, path, rippleAddress, freshInfo, info;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _BlockchainLink.create)(this.params.coinInfo, this.postMessage);

            case 2:
              blockchain = _context.sent;
              responses = [];
              i = 0;

            case 5:
              if (!(i < this.params.accounts.length)) {
                _context.next = 23;
                break;
              }

              account = this.params.accounts[i];
              path = account.path;

              if (!(path && !account.descriptor)) {
                _context.next = 14;
                break;
              }

              _context.next = 11;
              return this.device.getCommands().rippleGetAddress(path, false);

            case 11:
              rippleAddress = _context.sent;
              account.descriptor = rippleAddress.address;
              account.serializedPath = (0, _pathUtils.getSerializedPath)(path);

            case 14:
              _context.next = 16;
              return blockchain.getAccountInfo(account.descriptor, {
                level: this.params.level,
                from: account.block
              });

            case 16:
              freshInfo = _context.sent;
              info = (0, _objectSpread2.default)({}, account, freshInfo);
              responses.push(info);

              if (this.params.bundledResponse) {
                // send progress
                this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
                  progress: i,
                  response: info
                }));
              }

            case 20:
              i++;
              _context.next = 5;
              break;

            case 23:
              return _context.abrupt("return", this.params.bundledResponse ? responses : responses[0]);

            case 24:
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

  return RippleGetAccountInfo;
}(_AbstractMethod2.default);

exports.default = RippleGetAccountInfo;