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

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _Discovery = _interopRequireDefault(require("./helpers/Discovery"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _errors = require("../../constants/errors");

var _pathUtils = require("../../utils/pathUtils");

var _deferred = require("../../utils/deferred");

var _account = _interopRequireWildcard(require("../../account"));

var _backend = _interopRequireWildcard(require("../../backend"));

var _CoinInfo = require("../../data/CoinInfo");

var _builder = require("../../message/builder");

var GetAccountInfo =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(GetAccountInfo, _AbstractMethod);

  function GetAccountInfo(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = ['read'];
    _this.info = 'Export account info';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'coin',
      type: 'string'
    }, {
      name: 'xpub',
      type: 'string'
    }, {
      name: 'crossChain',
      type: 'boolean'
    }]);
    var path;
    var coinInfo;

    if (payload.coin) {
      coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);
    }

    if (payload.path) {
      path = (0, _pathUtils.validatePath)(payload.path, 3, true);

      if (!coinInfo) {
        coinInfo = (0, _CoinInfo.getBitcoinNetwork)(path);
      } else if (!payload.crossChain) {
        (0, _paramsValidator.validateCoinPath)(coinInfo, path);
      }
    } // if there is no coinInfo at this point return error


    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    } else {
      // check required firmware with coinInfo support
      _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, coinInfo, _this.firmwareRange);
    }

    _this.params = {
      path: path,
      xpub: payload.xpub,
      coinInfo: coinInfo
    };
    return _this;
  }

  var _proto = GetAccountInfo.prototype;

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

              if (!this.params.path) {
                _context.next = 9;
                break;
              }

              label = (0, _pathUtils.getAccountLabel)(this.params.path, this.params.coinInfo);
              _context.next = 14;
              break;

            case 9:
              if (!this.params.xpub) {
                _context.next = 13;
                break;
              }

              label = "Export " + this.params.coinInfo.label + " account for public key <span>" + this.params.xpub + "</span>";
              _context.next = 14;
              break;

            case 13:
              return _context.abrupt("return", true);

            case 14:
              // request confirmation view
              this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-account-info',
                label: label
              })); // wait for user action

              _context.next = 17;
              return uiPromise.promise;

            case 17:
              uiResp = _context.sent;
              this.confirmed = uiResp.payload;
              return _context.abrupt("return", this.confirmed);

            case 20:
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

  _proto.noBackupConfirmation =
  /*#__PURE__*/
  function () {
    var _noBackupConfirmation = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var uiPromise, uiResp;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.getPopupPromise().promise;

            case 2:
              // initialize user response promise
              uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

              this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'no-backup'
              })); // wait for user action

              _context2.next = 6;
              return uiPromise.promise;

            case 6:
              uiResp = _context2.sent;
              return _context2.abrupt("return", uiResp.payload);

            case 8:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function noBackupConfirmation() {
      return _noBackupConfirmation.apply(this, arguments);
    }

    return noBackupConfirmation;
  }();

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3() {
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return (0, _backend.create)(this.params.coinInfo);

            case 2:
              this.backend = _context3.sent;

              if (!this.params.path) {
                _context3.next = 9;
                break;
              }

              _context3.next = 6;
              return this._getAccountFromPath(this.params.path);

            case 6:
              return _context3.abrupt("return", _context3.sent);

            case 9:
              if (!this.params.xpub) {
                _context3.next = 15;
                break;
              }

              _context3.next = 12;
              return this._getAccountFromPublicKey();

            case 12:
              return _context3.abrupt("return", _context3.sent);

            case 15:
              _context3.next = 17;
              return this._getAccountFromDiscovery();

            case 17:
              return _context3.abrupt("return", _context3.sent);

            case 18:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function run() {
      return _run.apply(this, arguments);
    }

    return run;
  }();

  _proto._getAccountFromPath =
  /*#__PURE__*/
  function () {
    var _getAccountFromPath2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4(path) {
      var coinInfo, node, account, discovery;
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              coinInfo = (0, _CoinInfo.fixCoinInfoNetwork)(this.params.coinInfo, path);
              _context4.next = 3;
              return this.device.getCommands().getHDNode(path, coinInfo);

            case 3:
              node = _context4.sent;
              account = (0, _account.create)(path, node, coinInfo);
              discovery = this.discovery = new _Discovery.default({
                getHDNode: this.device.getCommands().getHDNode.bind(this.device.getCommands()),
                coinInfo: coinInfo,
                backend: this.backend,
                loadInfo: false
              });
              _context4.next = 8;
              return discovery.getAccountInfo(account);

            case 8:
              return _context4.abrupt("return", this._response(account));

            case 9:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function _getAccountFromPath(_x) {
      return _getAccountFromPath2.apply(this, arguments);
    }

    return _getAccountFromPath;
  }();

  _proto._getAccountFromPublicKey =
  /*#__PURE__*/
  function () {
    var _getAccountFromPublicKey2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6() {
      var _this2 = this;

      var discovery, xpub, deferred;
      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              discovery = this.discovery = new _Discovery.default({
                getHDNode: this.device.getCommands().getHDNode.bind(this.device.getCommands()),
                coinInfo: this.params.coinInfo,
                backend: this.backend,
                loadInfo: false
              });
              xpub = this.params.xpub || 'only-for-flow-correctness';
              deferred = (0, _deferred.create)('account_discovery');
              discovery.on('update',
              /*#__PURE__*/
              function () {
                var _ref = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee5(accounts) {
                  var account;
                  return _regenerator.default.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          account = accounts.find(function (a) {
                            return a.xpub === xpub || a.xpubSegwit === xpub;
                          });

                          if (!account) {
                            _context5.next = 8;
                            break;
                          }

                          discovery.removeAllListeners();
                          discovery.completed = true;
                          _context5.next = 6;
                          return discovery.getAccountInfo(account);

                        case 6:
                          discovery.stop();
                          deferred.resolve(_this2._response(account));

                        case 8:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, this);
                }));

                return function (_x2) {
                  return _ref.apply(this, arguments);
                };
              }());
              discovery.on('complete', function () {
                deferred.reject(new Error("Account with xpub " + xpub + " not found on device " + _this2.device.features.label));
              });
              discovery.start();
              _context6.next = 8;
              return deferred.promise;

            case 8:
              return _context6.abrupt("return", _context6.sent);

            case 9:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function _getAccountFromPublicKey() {
      return _getAccountFromPublicKey2.apply(this, arguments);
    }

    return _getAccountFromPublicKey;
  }();

  _proto._getAccountFromDiscovery =
  /*#__PURE__*/
  function () {
    var _getAccountFromDiscovery2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7() {
      var _this3 = this;

      var discovery, uiResp, resp, account;
      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              discovery = this.discovery = new _Discovery.default({
                getHDNode: this.device.getCommands().getHDNode.bind(this.device.getCommands()),
                coinInfo: this.params.coinInfo,
                backend: this.backend
              });
              discovery.on('update', function (accounts) {
                _this3.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                  coinInfo: _this3.params.coinInfo,
                  accounts: accounts.map(function (a) {
                    return a.toMessage();
                  })
                }));
              });
              discovery.on('complete', function (accounts) {
                _this3.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                  coinInfo: _this3.params.coinInfo,
                  accounts: accounts.map(function (a) {
                    return a.toMessage();
                  }),
                  complete: true
                }));
              });
              _context7.prev = 3;
              discovery.start();
              _context7.next = 10;
              break;

            case 7:
              _context7.prev = 7;
              _context7.t0 = _context7["catch"](3);
              throw _context7.t0;

            case 10:
              // set select account view
              // this view will be updated from discovery events
              this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                coinInfo: this.params.coinInfo,
                accounts: [],
                start: true
              })); // wait for user action

              _context7.next = 13;
              return this.createUiPromise(UI.RECEIVE_ACCOUNT, this.device).promise;

            case 13:
              uiResp = _context7.sent;
              discovery.stop();
              resp = parseInt(uiResp.payload);
              account = discovery.accounts[resp];
              return _context7.abrupt("return", this._response(account));

            case 18:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this, [[3, 7]]);
    }));

    function _getAccountFromDiscovery() {
      return _getAccountFromDiscovery2.apply(this, arguments);
    }

    return _getAccountFromDiscovery;
  }();

  _proto._response = function _response(account) {
    var nextAddress = account.getNextAddress();
    var info = {
      id: account.id,
      path: account.path,
      serializedPath: (0, _pathUtils.getSerializedPath)(account.path),
      address: nextAddress,
      addressIndex: account.getNextAddressId(),
      addressPath: account.getAddressPath(nextAddress),
      addressSerializedPath: (0, _pathUtils.getSerializedPath)(account.getAddressPath(nextAddress)),
      xpub: account.xpub,
      xpubSegwit: account.xpubSegwit,
      balance: account.getBalance(),
      confirmed: account.getConfirmedBalance(),
      transactions: account.getTransactionsCount(),
      utxo: account.getUtxos(),
      usedAddresses: account.getUsedAddresses(),
      unusedAddresses: account.getUnusedAddresses()
    };

    if (typeof info.xpubSegwit !== 'string') {
      delete info.xpubSegwit;
    }

    return info;
  };

  _proto.dispose = function dispose() {
    if (this.discovery) {
      var d = this.discovery;
      d.stop();
      d.removeAllListeners();
    }
  };

  return GetAccountInfo;
}(_AbstractMethod2.default);

exports.default = GetAccountInfo;