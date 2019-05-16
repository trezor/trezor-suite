"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _hdWallet = require("hd-wallet");

var _account = _interopRequireDefault(require("../../../account"));

var _backend = _interopRequireDefault(require("../../../backend"));

var _fees = require("./fees");

var customFeeLevel = {
  name: 'custom',
  id: 4,
  info: {
    type: 'custom',
    fee: '10'
  }
};

var TransactionComposer =
/*#__PURE__*/
function () {
  // composed: Array<BuildTxResult> = [];
  function TransactionComposer(account, outputs) {
    (0, _defineProperty2.default)(this, "feeLevels", []);
    (0, _defineProperty2.default)(this, "composed", {});
    this.account = account;
    this.outputs = outputs;
  }

  var _proto = TransactionComposer.prototype;

  _proto.init =
  /*#__PURE__*/
  function () {
    var _init = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(backend) {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return (0, _fees.init)(backend, this.account.coinInfo);

            case 2:
              this.feeLevels = [].concat((0, _fees.getFeeLevels)());
              _context.next = 5;
              return backend.loadCurrentHeight();

            case 5:
              this.currentHeight = _context.sent;

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function init(_x) {
      return _init.apply(this, arguments);
    }

    return init;
  }() // Composing fee levels for SelectFee view in popup
  // async composeAllFeeLevels(): Promise<Array<BuildTxResult>> {
  ;

  _proto.composeAllFeeLevels =
  /*#__PURE__*/
  function () {
    var _composeAllFeeLevels = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee2() {
      var account, prevFee, level, atLeastOneValid, _iterator, _isArray, _i, fee, _tx, tx;

      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              account = this.account;
              this.composed = {};
              prevFee = new _bignumber.default(0);
              atLeastOneValid = false;
              _iterator = this.feeLevels, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();

            case 5:
              if (!_isArray) {
                _context2.next = 11;
                break;
              }

              if (!(_i >= _iterator.length)) {
                _context2.next = 8;
                break;
              }

              return _context2.abrupt("break", 28);

            case 8:
              level = _iterator[_i++];
              _context2.next = 15;
              break;

            case 11:
              _i = _iterator.next();

              if (!_i.done) {
                _context2.next = 14;
                break;
              }

              return _context2.abrupt("break", 28);

            case 14:
              level = _i.value;

            case 15:
              fee = (0, _fees.getActualFee)(level, this.account.coinInfo);
              if (prevFee.gt(0) && prevFee.lt(fee)) fee = prevFee.toString();
              prevFee = new _bignumber.default(fee);
              _tx = this.compose(fee);

              if (!(_tx.type === 'final')) {
                _context2.next = 23;
                break;
              }

              atLeastOneValid = true;
              _context2.next = 25;
              break;

            case 23:
              if (!(_tx.type === 'error' && _tx.error === 'TWO-SEND-MAX')) {
                _context2.next = 25;
                break;
              }

              throw new Error('Cannot compose transaction with two send-max outputs');

            case 25:
              this.composed[level.name] = _tx;

            case 26:
              _context2.next = 5;
              break;

            case 28:
              if (atLeastOneValid) {
                _context2.next = 36;
                break;
              }

              // check with minimal fee
              tx = this.compose(account.coinInfo.minFee.toString());

              if (!(tx.type === 'final')) {
                _context2.next = 35;
                break;
              }

              // add custom Fee level to list
              this.feeLevels.push(customFeeLevel);
              this.composed['custom'] = tx;
              _context2.next = 36;
              break;

            case 35:
              return _context2.abrupt("return", false);

            case 36:
              return _context2.abrupt("return", true);

            case 37:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function composeAllFeeLevels() {
      return _composeAllFeeLevels.apply(this, arguments);
    }

    return composeAllFeeLevels;
  }();

  _proto.composeCustomFee = function composeCustomFee(fee) {
    var tx = this.compose(typeof fee === 'number' ? fee.toString() : fee);

    if (!this.composed['custom']) {
      this.feeLevels.push(customFeeLevel);
    }

    this.composed['custom'] = tx;

    if (tx.type === 'final') {
      return {
        name: 'custom',
        fee: tx.fee,
        feePerByte: tx.feePerByte,
        minutes: this.getEstimatedTime(tx.fee),
        total: tx.totalSpent
      };
    } else {
      return {
        name: 'custom',
        fee: '0',
        disabled: true
      };
    }
  };

  _proto.getFeeLevelList = function getFeeLevelList() {
    var _this = this;

    var list = [];
    this.feeLevels.forEach(function (level) {
      var tx = _this.composed[level.name];

      if (tx && tx.type === 'final') {
        list.push({
          name: level.name,
          fee: tx.fee,
          feePerByte: tx.feePerByte,
          minutes: _this.getEstimatedTime(tx.fee),
          total: tx.totalSpent
        });
      } else {
        list.push({
          name: level.name,
          fee: '0',
          disabled: true
        });
      }
    });
    return list;
  };

  _proto.compose = function compose(fee) {
    var account = this.account;
    var feeValue = typeof fee === 'string' ? fee : (0, _fees.getActualFee)(fee, account.coinInfo);
    var tx = (0, _hdWallet.buildTx)({
      utxos: account.getUtxos(),
      outputs: this.outputs,
      height: this.currentHeight,
      feeRate: feeValue,
      segwit: account.coinInfo.segwit,
      inputAmounts: account.coinInfo.segwit || account.coinInfo.forkid !== null,
      basePath: account.getPath(),
      network: account.coinInfo.network,
      changeId: account.getChangeIndex(),
      changeAddress: account.getNextChangeAddress(),
      dustThreshold: account.coinInfo.dustLimit
    });
    return tx;
  };

  _proto.getEstimatedTime = function getEstimatedTime(fee) {
    var minutes = 0;
    var blocks = (0, _fees.getBlocks)(fee);

    if (blocks) {
      minutes = this.account.coinInfo.blocktime * blocks;
    }

    return minutes;
  };

  _proto.dispose = function dispose() {// TODO
  };

  return TransactionComposer;
}();

exports.default = TransactionComposer;