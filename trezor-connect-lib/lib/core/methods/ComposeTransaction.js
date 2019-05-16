"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _Discovery = _interopRequireDefault(require("./helpers/Discovery"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _CoinInfo = require("../../data/CoinInfo");

var _paramsValidator = require("./helpers/paramsValidator");

var _promiseUtils = require("../../utils/promiseUtils");

var _formatUtils = require("../../utils/formatUtils");

var _errors = require("../../constants/errors");

var _backend = _interopRequireWildcard(require("../../backend"));

var _account = _interopRequireDefault(require("../../account"));

var _TransactionComposer = _interopRequireDefault(require("./tx/TransactionComposer"));

var _tx = require("./tx");

var _signtx = _interopRequireDefault(require("./helpers/signtx"));

var _signtxVerify = _interopRequireDefault(require("./helpers/signtxVerify"));

var _builder = require("../../message/builder");

var ComposeTransaction =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(ComposeTransaction, _AbstractMethod);

  function ComposeTransaction(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'outputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }, {
      name: 'push',
      type: 'boolean'
    }]);
    var coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    } // set required firmware from coinInfo support


    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, coinInfo, _this.firmwareRange); // validate each output and transform into hd-wallet format

    var outputs = [];
    var total = new _bignumber.default(0);
    payload.outputs.forEach(function (out) {
      var output = (0, _tx.validateHDOutput)(out, coinInfo);

      if (typeof output.amount === 'string') {
        total = total.plus(output.amount);
      }

      outputs.push(output);
    });
    var sendMax = outputs.find(function (o) {
      return o.type === 'send-max';
    }) !== undefined; // there should be only one output when using send-max option

    if (sendMax && outputs.length > 1) {
      throw new Error('Only one output allowed when using "send-max" option.');
    } // if outputs contains regular items
    // check if total amount is not lower than dust limit


    if (outputs.find(function (o) {
      return o.type === 'complete';
    }) !== undefined && total.lte(coinInfo.dustLimit)) {
      throw new Error('Total amount is too low. ');
    }

    if (sendMax) {
      _this.info = 'Send maximum amount';
    } else {
      _this.info = "Send " + (0, _formatUtils.formatAmount)(total, coinInfo);
    }

    _this.params = {
      outputs: outputs,
      coinInfo: coinInfo,
      push: payload.hasOwnProperty('push') ? payload.push : false
    };
    return _this;
  }

  var _proto = ComposeTransaction.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var account, response;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _backend.create)(this.params.coinInfo);

            case 2:
              this.backend = _context.sent;
              _context.next = 5;
              return this._getAccount();

            case 5:
              account = _context.sent;

              if (!(account instanceof _account.default)) {
                _context.next = 19;
                break;
              }

              _context.next = 9;
              return this._getFee(account);

            case 9:
              response = _context.sent;

              if (!(typeof response === 'string')) {
                _context.next = 16;
                break;
              }

              _context.next = 13;
              return this.run();

            case 13:
              return _context.abrupt("return", _context.sent);

            case 16:
              return _context.abrupt("return", response);

            case 17:
              _context.next = 20;
              break;

            case 19:
              throw new Error(account.error);

            case 20:
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

  _proto._getAccount =
  /*#__PURE__*/
  function () {
    var _getAccount2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var _this2 = this;

      var discovery, uiResp, resp;
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              discovery = this.discovery || new _Discovery.default({
                getHDNode: this.device.getCommands().getHDNode.bind(this.device.getCommands()),
                coinInfo: this.params.coinInfo,
                backend: this.backend
              });
              discovery.on('update', function (accounts) {
                _this2.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                  coinInfo: _this2.params.coinInfo,
                  accounts: accounts.map(function (a) {
                    return a.toMessage();
                  }),
                  checkBalance: true
                }));
              });
              discovery.on('complete', function (accounts) {
                _this2.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                  coinInfo: _this2.params.coinInfo,
                  accounts: accounts.map(function (a) {
                    return a.toMessage();
                  }),
                  checkBalance: true,
                  complete: true
                }));
              });

              if (!this.discovery) {
                this.discovery = discovery;
              }

              discovery.start(); // set select account view
              // this view will be updated from discovery events

              this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
                coinInfo: this.params.coinInfo,
                accounts: discovery.accounts.map(function (a) {
                  return a.toMessage();
                }),
                checkBalance: true,
                start: true,
                complete: discovery.completed
              })); // wait for user action

              _context2.next = 8;
              return this.createUiPromise(UI.RECEIVE_ACCOUNT, this.device).promise;

            case 8:
              uiResp = _context2.sent;
              discovery.removeAllListeners();
              discovery.stop();
              resp = parseInt(uiResp.payload);
              return _context2.abrupt("return", discovery.accounts[resp]);

            case 13:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function _getAccount() {
      return _getAccount2.apply(this, arguments);
    }

    return _getAccount;
  }();

  _proto._getFee =
  /*#__PURE__*/
  function () {
    var _getFee2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee3(account) {
      var composer, hasFunds;
      return _regenerator.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (this.composer) {
                this.composer.dispose();
              }

              composer = new _TransactionComposer.default(account, this.params.outputs);
              _context3.next = 4;
              return composer.init(this.backend);

            case 4:
              this.composer = composer;
              _context3.next = 7;
              return composer.composeAllFeeLevels();

            case 7:
              hasFunds = _context3.sent;

              if (hasFunds) {
                _context3.next = 13;
                break;
              }

              // show error view
              this.postMessage(new _builder.UiMessage(UI.INSUFFICIENT_FUNDS)); // wait few seconds...

              _context3.next = 12;
              return (0, _promiseUtils.resolveAfter)(2000, null);

            case 12:
              return _context3.abrupt("return", 'change-account');

            case 13:
              // set select account view
              // this view will be updated from discovery events
              this.postMessage(new _builder.UiMessage(UI.SELECT_FEE, {
                feeLevels: composer.getFeeLevelList(),
                coinInfo: this.params.coinInfo
              })); // wait for user action
              // const uiResp: UiPromiseResponse = await this.createUiPromise(UI.RECEIVE_FEE, this.device).promise;

              _context3.next = 16;
              return this._selectFeeUiResponse();

            case 16:
              return _context3.abrupt("return", _context3.sent);

            case 17:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function _getFee(_x) {
      return _getFee2.apply(this, arguments);
    }

    return _getFee;
  }();

  _proto._selectFeeUiResponse =
  /*#__PURE__*/
  function () {
    var _selectFeeUiResponse2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee4() {
      var resp;
      return _regenerator.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.createUiPromise(UI.RECEIVE_FEE, this.device).promise;

            case 2:
              resp = _context4.sent;
              _context4.t0 = resp.payload.type;
              _context4.next = _context4.t0 === 'compose-custom' ? 6 : _context4.t0 === 'send' ? 10 : _context4.t0 === 'change-account' ? 13 : 13;
              break;

            case 6:
              // recompose custom fee level with requested value
              this.postMessage(new _builder.UiMessage(UI.UPDATE_CUSTOM_FEE, {
                level: this.composer.composeCustomFee(resp.payload.value),
                coinInfo: this.params.coinInfo
              })); // wait for user action

              _context4.next = 9;
              return this._selectFeeUiResponse();

            case 9:
              return _context4.abrupt("return", _context4.sent);

            case 10:
              _context4.next = 12;
              return this._send(resp.payload.value);

            case 12:
              return _context4.abrupt("return", _context4.sent);

            case 13:
              return _context4.abrupt("return", 'change-account');

            case 14:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function _selectFeeUiResponse() {
      return _selectFeeUiResponse2.apply(this, arguments);
    }

    return _selectFeeUiResponse;
  }();

  _proto._send =
  /*#__PURE__*/
  function () {
    var _send2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee5(feeLevel) {
      var tx, bjsRefTxs, refTxs, coinInfo, timestamp, inputs, outputs, response, txid;
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              tx = this.composer.composed[feeLevel];

              if (!(tx.type !== 'final')) {
                _context5.next = 3;
                break;
              }

              throw new Error('Trying to sign unfinished tx');

            case 3:
              _context5.next = 5;
              return this.backend.loadTransactions((0, _tx.getReferencedTransactions)(tx.transaction.inputs));

            case 5:
              bjsRefTxs = _context5.sent;
              refTxs = (0, _tx.transformReferencedTransactions)(bjsRefTxs);
              coinInfo = this.composer.account.coinInfo;
              timestamp = coinInfo.hasTimestamp ? Math.round(new Date().getTime() / 1000) : undefined;
              inputs = tx.transaction.inputs.map(function (inp) {
                return (0, _tx.inputToTrezor)(inp, 0);
              });
              outputs = tx.transaction.outputs.sorted.map(function (out) {
                return (0, _tx.outputToTrezor)(out, coinInfo);
              });
              _context5.next = 13;
              return (0, _signtx.default)(this.device.getCommands().typedCall.bind(this.device.getCommands()), inputs, outputs, refTxs, {
                timestamp: timestamp
              }, coinInfo);

            case 13:
              response = _context5.sent;
              _context5.next = 16;
              return (0, _signtxVerify.default)(this.device.getCommands().getHDNode.bind(this.device.getCommands()), inputs, outputs, response.serializedTx, coinInfo);

            case 16:
              if (!this.params.push) {
                _context5.next = 21;
                break;
              }

              _context5.next = 19;
              return this.backend.sendTransactionHex(response.serializedTx);

            case 19:
              txid = _context5.sent;
              return _context5.abrupt("return", (0, _objectSpread2.default)({}, response, {
                txid: txid
              }));

            case 21:
              return _context5.abrupt("return", response);

            case 22:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function _send(_x2) {
      return _send2.apply(this, arguments);
    }

    return _send;
  }();

  _proto.dispose = function dispose() {
    if (this.discovery) {
      var d = this.discovery;
      d.stop();
      d.removeAllListeners();
    }

    if (this.composer) {
      this.composer.dispose();
    }
  };

  return ComposeTransaction;
}(_AbstractMethod2.default);

exports.default = ComposeTransaction;