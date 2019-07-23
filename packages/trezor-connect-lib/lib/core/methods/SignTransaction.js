"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var _errors = require("../../constants/errors");

var _backend2 = _interopRequireWildcard(require("../../backend"));

var _signtx = _interopRequireDefault(require("./helpers/signtx"));

var _signtxVerify = _interopRequireDefault(require("./helpers/signtxVerify"));

var _tx = require("./tx");

var SignTransaction =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(SignTransaction, _AbstractMethod);

  function SignTransaction(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    _this.info = 'Sign transaction';
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'coin',
      type: 'string',
      obligatory: true
    }, {
      name: 'inputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'outputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'refTxs',
      type: 'array',
      allowEmpty: true
    }, {
      name: 'locktime',
      type: 'number'
    }, {
      name: 'timestamp',
      type: 'number'
    }, {
      name: 'version',
      type: 'number'
    }, {
      name: 'expiry',
      type: 'number'
    }, {
      name: 'overwintered',
      type: 'boolean'
    }, {
      name: 'versionGroupId',
      type: 'number'
    }, {
      name: 'branchId',
      type: 'number'
    }, {
      name: 'push',
      type: 'boolean'
    }]);
    var coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    } else {
      // set required firmware from coinInfo support
      _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, coinInfo, _this.firmwareRange);
      _this.info = (0, _pathUtils.getLabel)('Sign #NETWORK transaction', coinInfo);
    }

    if (payload.hasOwnProperty('refTxs')) {
      payload.refTxs.forEach(function (tx) {
        (0, _paramsValidator.validateParams)(tx, [{
          name: 'hash',
          type: 'string',
          obligatory: true
        }, {
          name: 'inputs',
          type: 'array',
          obligatory: true
        }, {
          name: 'bin_outputs',
          type: 'array',
          obligatory: true
        }, {
          name: 'version',
          type: 'number',
          obligatory: true
        }, {
          name: 'lock_time',
          type: 'number',
          obligatory: true
        }, {
          name: 'extra_data',
          type: 'string'
        }, {
          name: 'timestamp',
          type: 'number'
        }, {
          name: 'version_group_id',
          type: 'number'
        }]);
      });
    }

    var inputs = (0, _tx.validateTrezorInputs)(payload.inputs, coinInfo);
    var outputs = (0, _tx.validateTrezorOutputs)(payload.outputs, coinInfo);
    var outputsWithAmount = outputs.filter(function (output) {
      return typeof output.amount === 'string' && !output.hasOwnProperty('op_return_data');
    });

    if (outputsWithAmount.length > 0) {
      var total = outputsWithAmount.reduce(function (bn, output) {
        return bn.plus(typeof output.amount === 'string' ? output.amount : '0');
      }, new _bignumber.default(0));

      if (total.lte(coinInfo.dustLimit)) {
        throw new Error('Total amount is below dust limit.');
      }
    }

    _this.params = {
      inputs: inputs,
      outputs: payload.outputs,
      refTxs: payload.refTxs,
      options: {
        lock_time: payload.locktime,
        timestamp: payload.timestamp,
        version: payload.version,
        expiry: payload.expiry,
        overwintered: payload.overwintered,
        version_group_id: payload.versionGroupId,
        branch_id: payload.branchId
      },
      coinInfo: coinInfo,
      push: payload.hasOwnProperty('push') ? payload.push : false
    };

    if (coinInfo.hasTimestamp && !payload.hasOwnProperty('timestamp')) {
      var d = new Date();
      _this.params.options.timestamp = Math.round(d.getTime() / 1000);
    }

    return _this;
  }

  var _proto = SignTransaction.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var device, params, refTxs, backend, hdInputs, bjsRefTxs, response, _backend, txid;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              device = this.device, params = this.params;
              refTxs = [];

              if (params.refTxs) {
                _context.next = 13;
                break;
              }

              _context.next = 5;
              return (0, _backend2.create)(params.coinInfo);

            case 5:
              backend = _context.sent;
              hdInputs = params.inputs.map(_tx.inputToHD);
              _context.next = 9;
              return backend.loadTransactions((0, _tx.getReferencedTransactions)(hdInputs));

            case 9:
              bjsRefTxs = _context.sent;
              refTxs = (0, _tx.transformReferencedTransactions)(bjsRefTxs);
              _context.next = 14;
              break;

            case 13:
              refTxs = params.refTxs;

            case 14:
              _context.next = 16;
              return (0, _signtx.default)(device.getCommands().typedCall.bind(device.getCommands()), params.inputs, params.outputs, refTxs, params.options, params.coinInfo);

            case 16:
              response = _context.sent;
              _context.next = 19;
              return (0, _signtxVerify.default)(device.getCommands().getHDNode.bind(device.getCommands()), params.inputs, params.outputs, response.serializedTx, params.coinInfo);

            case 19:
              if (!params.push) {
                _context.next = 27;
                break;
              }

              _context.next = 22;
              return (0, _backend2.create)(params.coinInfo);

            case 22:
              _backend = _context.sent;
              _context.next = 25;
              return _backend.sendTransactionHex(response.serializedTx);

            case 25:
              txid = _context.sent;
              return _context.abrupt("return", (0, _objectSpread2.default)({}, response, {
                txid: txid
              }));

            case 27:
              return _context.abrupt("return", response);

            case 28:
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

  return SignTransaction;
}(_AbstractMethod2.default);

exports.default = SignTransaction;