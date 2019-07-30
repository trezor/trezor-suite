"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _account = _interopRequireWildcard(require("../../../account"));

var _backend = _interopRequireDefault(require("../../../backend"));

var _CoinInfo = require("../../../data/CoinInfo");

var _pathUtils = require("../../../utils/pathUtils");

var Discovery =
/*#__PURE__*/
function (_EventEmitter) {
  (0, _inheritsLoose2.default)(Discovery, _EventEmitter);

  function Discovery(options) {
    var _this;

    _this = _EventEmitter.call(this) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "accounts", []);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "interrupted", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "completed", false);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "loadInfo", true);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "limit", 10);

    if (typeof options.loadInfo === 'boolean') {
      _this.loadInfo = options.loadInfo;
    }

    if (typeof options.limit === 'number') {
      _this.limit = 10;
    }

    _this.options = options;
    return _this;
  }

  var _proto = Discovery.prototype;

  _proto.start =
  /*#__PURE__*/
  function () {
    var _start = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var prevAccount, index, _coinInfo, _path;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              this.interrupted = false;

            case 1:
              if (!(!this.completed && !this.interrupted)) {
                _context.next = 20;
                break;
              }

              prevAccount = this.accounts[this.accounts.length - 1];
              index = prevAccount ? prevAccount.id + 1 : 0;
              _coinInfo = (0, _CoinInfo.cloneCoinInfo)(prevAccount ? prevAccount.coinInfo : this.options.coinInfo);

              if (!(index >= this.limit || this.loadInfo && prevAccount && !prevAccount.isUsed())) {
                _context.next = 15;
                break;
              }

              if (_coinInfo.segwit) {
                _context.next = 12;
                break;
              }

              this.completed = true;
              this.emit('complete', this.accounts);
              return _context.abrupt("return");

            case 12:
              _coinInfo.network = this.options.coinInfo.network;
              _coinInfo.segwit = false;
              index = 0;

            case 15:
              _path = (0, _pathUtils.getPathFromIndex)(_coinInfo.segwit ? 49 : 44, _coinInfo.slip44, index);
              _context.next = 18;
              return this.discoverAccount(_path, _coinInfo);

            case 18:
              _context.next = 1;
              break;

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function start() {
      return _start.apply(this, arguments);
    }

    return start;
  }();

  _proto.stop = function stop() {
    this.interrupted = !this.completed;

    if (this.disposer) {
      this.disposer();
    } // if last account was not completely loaded
    // remove it from list


    var lastAccount = this.accounts[this.accounts.length - 1];

    if (lastAccount && !lastAccount.info) {
      this.accounts.splice(this.accounts.length - 1, 1);
      (0, _account.remove)(lastAccount);
    }
  };

  _proto.dispose = function dispose() {
    // TODO: clear up all references
    this.accounts.forEach(function (a) {
      return (0, _account.remove)(a);
    });
    delete this.accounts;
    delete this.options;
  };

  _proto.discoverAccount =
  /*#__PURE__*/
  function () {
    var _discoverAccount = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2(path, coinInfo) {
      var node, account;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!this.interrupted) {
                _context2.next = 2;
                break;
              }

              return _context2.abrupt("return", null);

            case 2:
              _context2.next = 4;
              return this.options.getHDNode(path, coinInfo);

            case 4:
              node = _context2.sent;

              if (!this.interrupted) {
                _context2.next = 7;
                break;
              }

              return _context2.abrupt("return", null);

            case 7:
              account = (0, _account.create)(path, node, coinInfo);
              this.accounts.push(account);
              this.emit('update', this.accounts);

              if (this.loadInfo) {
                _context2.next = 12;
                break;
              }

              return _context2.abrupt("return", account);

            case 12:
              _context2.next = 14;
              return this.getAccountInfo(account);

            case 14:
              if (!this.interrupted) {
                _context2.next = 16;
                break;
              }

              return _context2.abrupt("return", null);

            case 16:
              this.emit('update', this.accounts);
              return _context2.abrupt("return", account);

            case 18:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function discoverAccount(_x, _x2) {
      return _discoverAccount.apply(this, arguments);
    }

    return discoverAccount;
  }();

  _proto.getAccountInfo =
  /*#__PURE__*/
  function () {
    var _getAccountInfo = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(account) {
      var _this2 = this;

      var info;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.options.backend.loadAccountInfo(account.xpub, // account.id > 0 && !account.coinInfo.segwit ? "xpub6CjVMW1nZaGASd9NSoQv1WXHKUAdsHqYv8hb9B8zMGz1M5eVsQmcbtBnfhsejQT3Fc43gnjU141E2JrHxwqt5QT5qTyavxBkyK1iAGHxwyN" : account.xpub,
              account.info, account.coinInfo, function (progress) {
                account.transactions = progress.transactions;

                _this2.emit('update', _this2.accounts);
              }, function (disposer) {
                _this2.disposer = disposer;
              });

            case 2:
              info = _context3.sent;
              account.info = info;
              return _context3.abrupt("return", info);

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function getAccountInfo(_x3) {
      return _getAccountInfo.apply(this, arguments);
    }

    return getAccountInfo;
  }();

  return Discovery;
}(_events.default);

exports.default = Discovery;