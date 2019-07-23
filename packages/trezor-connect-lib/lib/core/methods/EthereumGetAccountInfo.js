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

var _Discovery = _interopRequireDefault(require("./helpers/Discovery"));

var _errors = require("../../constants/errors");

var _backend = _interopRequireWildcard(require("../../backend"));

var EthereumGetAccountInfo =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(EthereumGetAccountInfo, _AbstractMethod);

  function EthereumGetAccountInfo(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "confirmed", false);
    _this.requiredPermissions = [];
    _this.info = 'Export ethereum account info';
    _this.useDevice = false;
    _this.useUi = false;
    var payload = message.payload;
    var bundledResponse = true; // create a bundle with only one batch

    if (!payload.hasOwnProperty('accounts')) {
      payload.accounts = [].concat(payload.account);
      bundledResponse = false;
    } // validate incoming parameters


    (0, _paramsValidator.validateParams)(payload, [{
      name: 'accounts',
      type: 'array',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    payload.accounts.forEach(function (batch) {
      (0, _paramsValidator.validateParams)(batch, [{
        name: 'descriptor',
        type: 'string',
        obligatory: true
      }, {
        name: 'block',
        type: 'number',
        obligatory: true
      }, {
        name: 'transactions',
        type: 'number',
        obligatory: true
      }]);
    });
    var network = (0, _CoinInfo.getEthereumNetwork)(payload.coin);

    if (!network) {
      throw _errors.NO_COIN_INFO;
    }

    _this.params = {
      accounts: payload.accounts,
      coinInfo: network,
      bundledResponse: bundledResponse
    };
    return _this;
  }

  var _proto = EthereumGetAccountInfo.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var blockchain, _ref, height, responses, i, account, method, params, socket, confirmed;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _backend.create)(this.params.coinInfo);

            case 2:
              this.backend = _context.sent;
              blockchain = this.backend.blockchain;
              _context.next = 6;
              return blockchain.lookupSyncStatus();

            case 6:
              _ref = _context.sent;
              height = _ref.height;
              responses = [];
              i = 0;

            case 10:
              if (!(i < this.params.accounts.length)) {
                _context.next = 24;
                break;
              }

              account = this.params.accounts[i];
              method = 'getAddressHistory';
              params = [[account.descriptor], {
                start: height,
                end: account.block,
                from: 0,
                to: 0,
                queryMempol: false
              }];
              _context.next = 16;
              return blockchain.socket.promise;

            case 16:
              socket = _context.sent;
              _context.next = 19;
              return socket.send({
                method: method,
                params: params
              });

            case 19:
              confirmed = _context.sent;
              responses.push({
                descriptor: account.descriptor,
                transactions: confirmed.totalCount,
                block: height,
                balance: '0',
                // TODO: fetch balance from blockbook
                availableBalance: '0',
                // TODO: fetch balance from blockbook
                nonce: 0 // TODO: fetch nonce from blockbook

              });

            case 21:
              i++;
              _context.next = 10;
              break;

            case 24:
              return _context.abrupt("return", this.params.bundledResponse ? responses : responses[0]);

            case 25:
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

  return EthereumGetAccountInfo;
}(_AbstractMethod2.default);

exports.default = EthereumGetAccountInfo;