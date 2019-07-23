'use strict';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _AbstractMethod2 = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _ethereumUtils = require("../../utils/ethereumUtils");

var helper = _interopRequireWildcard(require("./helpers/ethereumSignTx"));

var EthereumSignTx =
/*#__PURE__*/
function (_AbstractMethod) {
  (0, _inheritsLoose2.default)(EthereumSignTx, _AbstractMethod);

  function EthereumSignTx(message) {
    var _this;

    _this = _AbstractMethod.call(this, message) || this;
    _this.requiredPermissions = ['read', 'write'];
    var payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    var path = (0, _pathUtils.validatePath)(payload.path, 3);
    var network = (0, _CoinInfo.getEthereumNetwork)(path);
    _this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(_this.name, network, _this.firmwareRange);
    _this.info = (0, _ethereumUtils.getNetworkLabel)('Sign #NETWORK transaction', network); // incoming transaction should be in EthereumTx format
    // https://github.com/ethereumjs/ethereumjs-tx

    var tx = payload.transaction;
    (0, _paramsValidator.validateParams)(tx, [{
      name: 'to',
      type: 'string',
      obligatory: true
    }, {
      name: 'value',
      type: 'string',
      obligatory: true
    }, {
      name: 'gasLimit',
      type: 'string',
      obligatory: true
    }, {
      name: 'gasPrice',
      type: 'string',
      obligatory: true
    }, {
      name: 'nonce',
      type: 'string',
      obligatory: true
    }, {
      name: 'data',
      type: 'string'
    }, {
      name: 'chainId',
      type: 'number'
    }, {
      name: 'txType',
      type: 'number'
    }]); // TODO: check if tx data is a valid hex
    // strip '0x' from values

    Object.keys(tx).map(function (key) {
      if (typeof tx[key] === 'string') {
        var value = (0, _ethereumUtils.stripHexPrefix)(tx[key]); // pad left even

        if (value.length % 2 !== 0) {
          value = '0' + value;
        } // $FlowIssue


        tx[key] = value;
      }
    });
    _this.params = {
      path: path,
      transaction: tx
    };
    return _this;
  }

  var _proto = EthereumSignTx.prototype;

  _proto.run =
  /*#__PURE__*/
  function () {
    var _run = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee() {
      var tx;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              tx = this.params.transaction;
              _context.next = 3;
              return helper.ethereumSignTx(this.device.getCommands().typedCall.bind(this.device.getCommands()), this.params.path, tx.to, tx.value, tx.gasLimit, tx.gasPrice, tx.nonce, tx.data, tx.chainId, tx.txType);

            case 3:
              return _context.abrupt("return", _context.sent);

            case 4:
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

  return EthereumSignTx;
}(_AbstractMethod2.default);

exports.default = EthereumSignTx;