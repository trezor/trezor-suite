'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _networkUtils = require("../utils/networkUtils");

var _browser = require("../utils/browser");

var _ConnectSettings = require("../data/ConnectSettings");

var _CoinInfo = require("./CoinInfo");

var _FirmwareInfo = require("./FirmwareInfo");

var _es6Promise = require("es6-promise");

var _parseUri = _interopRequireDefault(require("parse-uri"));

var bowser = _interopRequireWildcard(require("bowser"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

// TODO: transform json to flow typed object
var parseConfig = function parseConfig(json) {
  var config = json;
  return config;
};

var DataManager =
/*#__PURE__*/
function () {
  function DataManager() {}

  DataManager.load =
  /*#__PURE__*/
  function () {
    var _load = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(settings) {
      var ts, configUrl, config, isLocalhost, whitelist, knownHost, _iterator, _isArray, _i, _ref, asset, json, _iterator2, _isArray2, _i2, _ref2, protobuf, _json, browserName;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              ts = settings.timestamp;
              configUrl = settings.configSrc + "?r=" + ts;
              _context.prev = 2;
              this.settings = settings;
              _context.next = 6;
              return (0, _networkUtils.httpRequest)(configUrl, 'json');

            case 6:
              config = _context.sent;
              this.config = parseConfig(config); // check if origin is localhost or trusted

              isLocalhost = typeof window !== 'undefined' && window.location ? window.location.hostname === 'localhost' : true;
              whitelist = DataManager.isWhitelisted(this.settings.origin || '');
              this.settings.trustedHost = (isLocalhost || !!whitelist) && !this.settings.popup; // ensure that popup will be used

              if (!this.settings.trustedHost) {
                this.settings.popup = true;
              } // ensure that debug is disabled


              if (this.settings.debug && !this.settings.trustedHost && !whitelist) {
                this.settings.debug = false;
              }

              this.settings.priority = DataManager.getPriority(whitelist);
              knownHost = DataManager.getHostLabel(this.settings.extension || this.settings.origin || '');

              if (knownHost) {
                this.settings.hostLabel = knownHost.label;
                this.settings.hostIcon = knownHost.icon;
              }

              _iterator = this.config.assets, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();

            case 17:
              if (!_isArray) {
                _context.next = 23;
                break;
              }

              if (!(_i >= _iterator.length)) {
                _context.next = 20;
                break;
              }

              return _context.abrupt("break", 34);

            case 20:
              _ref = _iterator[_i++];
              _context.next = 27;
              break;

            case 23:
              _i = _iterator.next();

              if (!_i.done) {
                _context.next = 26;
                break;
              }

              return _context.abrupt("break", 34);

            case 26:
              _ref = _i.value;

            case 27:
              asset = _ref;
              _context.next = 30;
              return (0, _networkUtils.httpRequest)(asset.url + "?r=" + ts, asset.type || 'json');

            case 30:
              json = _context.sent;
              this.assets[asset.name] = json;

            case 32:
              _context.next = 17;
              break;

            case 34:
              _iterator2 = this.config.messages, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();

            case 35:
              if (!_isArray2) {
                _context.next = 41;
                break;
              }

              if (!(_i2 >= _iterator2.length)) {
                _context.next = 38;
                break;
              }

              return _context.abrupt("break", 52);

            case 38:
              _ref2 = _iterator2[_i2++];
              _context.next = 45;
              break;

            case 41:
              _i2 = _iterator2.next();

              if (!_i2.done) {
                _context.next = 44;
                break;
              }

              return _context.abrupt("break", 52);

            case 44:
              _ref2 = _i2.value;

            case 45:
              protobuf = _ref2;
              _context.next = 48;
              return (0, _networkUtils.httpRequest)(protobuf.json + "?r=" + ts, 'json');

            case 48:
              _json = _context.sent;
              this.messages[protobuf.name] = _json;

            case 50:
              _context.next = 35;
              break;

            case 52:
              // hotfix webusb + chrome:72, allow webextensions
              if (this.settings.popup && this.settings.webusb && this.settings.env !== 'webextension') {
                browserName = bowser.name.toLowerCase();

                if (browserName === 'chrome' || browserName === 'chromium') {
                  if ((0, _semverCompare.default)(bowser.version, '72') >= 0) {
                    this.settings.webusb = false;
                  }
                }
              } // parse bridge JSON


              this.assets['bridge'] = (0, _browser.parseBridgeJSON)(this.assets['bridge']); // parse coins definitions

              (0, _CoinInfo.parseCoinsJson)(this.assets['coins']); // parse firmware definitions

              (0, _FirmwareInfo.parseFirmware)(this.assets['firmware-t1']);
              (0, _FirmwareInfo.parseFirmware)(this.assets['firmware-t2']);
              _context.next = 62;
              break;

            case 59:
              _context.prev = 59;
              _context.t0 = _context["catch"](2);
              throw _context.t0;

            case 62:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[2, 59]]);
    }));

    function load(_x) {
      return _load.apply(this, arguments);
    }

    return load;
  }();

  DataManager.findMessages = function findMessages(model, fw) {
    var messages = this.config.messages.find(function (m) {
      var min = m.range.min[model];
      var max = m.range.max ? m.range.max[model] : fw;
      return (0, _semverCompare.default)(fw, min) >= 0 && (0, _semverCompare.default)(fw, max) <= 0;
    });
    return this.messages[messages ? messages.name : 'default'];
  };

  DataManager.getMessages = function getMessages(name) {
    return this.messages[name || 'default'];
  };

  DataManager.isWhitelisted = function isWhitelisted(origin) {
    if (!this.config) return null;
    var uri = (0, _parseUri.default)(origin);

    if (uri && typeof uri.host === 'string') {
      var parts = uri.host.split('.');

      if (parts.length > 2) {
        // subdomain
        uri.host = parts.slice(parts.length - 2, parts.length).join('.');
      }

      return this.config.whitelist.find(function (item) {
        return item.origin === origin || item.origin === uri.host;
      });
    }
  };

  DataManager.isManagementAllowed = function isManagementAllowed() {
    var _this = this;

    if (!this.config) return null;
    var uri = (0, _parseUri.default)(this.settings.origin);

    if (uri && typeof uri.host === 'string') {
      var parts = uri.host.split('.');

      if (parts.length > 2) {
        // subdomain
        uri.host = parts.slice(parts.length - 2, parts.length).join('.');
      }

      return this.config.management.find(function (item) {
        return item.origin === _this.settings.origin || item.origin === uri.host;
      });
    }
  };

  DataManager.getPriority = function getPriority(whitelist) {
    if (whitelist) {
      return whitelist.priority;
    }

    return _ConnectSettings.DEFAULT_PRIORITY;
  };

  DataManager.getHostLabel = function getHostLabel(origin) {
    return this.config.knownHosts.find(function (host) {
      return host.origin === origin;
    });
  };

  DataManager.getSettings = function getSettings(key) {
    if (!this.settings) return null;

    if (typeof key === 'string') {
      return this.settings[key];
    }

    return this.settings;
  };

  DataManager.getDebugSettings = function getDebugSettings(type) {
    return false;
  };

  DataManager.getConfig = function getConfig() {
    return this.config;
  };

  DataManager.getLatestBridgeVersion = function getLatestBridgeVersion() {
    return DataManager.assets.bridge;
  };

  return DataManager;
}();

exports.default = DataManager;
(0, _defineProperty2.default)(DataManager, "assets", {});
(0, _defineProperty2.default)(DataManager, "messages", {});