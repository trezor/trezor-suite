'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.stellarSignTx = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _paramsValidator = require("./paramsValidator");

var processTxRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(typedCall, operations, index) {
    var lastOp, op, type, response;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            lastOp = index + 1 >= operations.length;
            op = operations[index];
            type = op.type;
            delete op.type;

            if (!lastOp) {
              _context.next = 11;
              break;
            }

            _context.next = 7;
            return typedCall(type, 'StellarSignedTx', op);

          case 7:
            response = _context.sent;
            return _context.abrupt("return", response.message);

          case 11:
            _context.next = 13;
            return typedCall(type, 'StellarTxOpRequest', op);

          case 13:
            _context.next = 15;
            return processTxRequest(typedCall, operations, index + 1);

          case 15:
            return _context.abrupt("return", _context.sent);

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function processTxRequest(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var stellarSignTx =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(typedCall, address_n, networkPassphrase, tx) {
    var message, operations;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // eslint-disable-next-line no-use-before-define
            message = transformSignMessage(tx);
            message.address_n = address_n;
            message.network_passphrase = networkPassphrase;
            operations = [];
            tx.operations.forEach(function (op) {
              // eslint-disable-next-line no-use-before-define
              var transformed = transformOperation(op);

              if (transformed) {
                operations.push(transformed);
              }
            });
            _context2.next = 7;
            return typedCall('StellarSignTx', 'StellarTxOpRequest', message);

          case 7:
            _context2.next = 9;
            return processTxRequest(typedCall, operations, 0);

          case 9:
            return _context2.abrupt("return", _context2.sent);

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function stellarSignTx(_x4, _x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}(); // transform incoming parameters to protobuf messages format


exports.stellarSignTx = stellarSignTx;

var transformSignMessage = function transformSignMessage(tx) {
  var timebounds = tx.timebounds ? {
    timebounds_start: tx.timebounds.minTime,
    timebounds_end: tx.timebounds.maxTime
  } : null;
  var memo = tx.memo ? {
    memo_type: tx.memo.type,
    memo_text: tx.memo.text,
    memo_id: tx.memo.id,
    memo_hash: tx.memo.hash
  } : null;
  return (0, _objectSpread2.default)({
    address_n: [],
    // will be overridden
    network_passphrase: '',
    // will be overridden
    source_account: tx.source,
    fee: tx.fee,
    sequence_number: tx.sequence
  }, timebounds, memo, {
    num_operations: tx.operations.length
  });
}; // transform incoming parameters to protobuf messages format


var transformOperation = function transformOperation(op) {
  switch (op.type) {
    case 'createAccount':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'startingBalance',
        type: 'amount'
      }]);
      return {
        type: 'StellarCreateAccountOp',
        new_account: op.destination,
        source_account: op.source,
        starting_balance: parseInt(op.startingBalance, 10)
      };

    case 'payment':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'amount',
        type: 'amount'
      }]);
      return {
        type: 'StellarPaymentOp',
        source_account: op.source,
        destination_account: op.destination,
        asset: op.asset,
        amount: parseInt(op.amount, 10)
      };

    case 'pathPayment':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'destAmount',
        type: 'amount'
      }]);
      return {
        type: 'StellarPathPaymentOp',
        source_account: op.source,
        send_asset: op.sendAsset,
        send_max: op.sendMax,
        destination_account: op.destination,
        destination_asset: op.destAsset,
        destination_amount: parseInt(op.destAmount, 10),
        paths: op.path
      };

    case 'manageOffer':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'amount',
        type: 'amount'
      }]);
      return {
        type: 'StellarManageOfferOp',
        source_account: op.source,
        offer_id: op.offerId,
        amount: parseInt(op.amount, 10),
        buying_asset: op.buying,
        selling_asset: op.selling,
        price_n: op.price.n,
        price_d: op.price.d
      };

    case 'createPassiveOffer':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'amount',
        type: 'amount'
      }]);
      return {
        type: 'StellarCreatePassiveOfferOp',
        source_account: op.source,
        offer_id: op.offerId,
        amount: parseInt(op.amount, 10),
        buying_asset: op.buying,
        selling_asset: op.selling,
        price_n: op.price.n,
        price_d: op.price.d
      };

    case 'setOptions':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'signer',
        type: 'object'
      }]);
      if (!op.signer) op.signer = {};
      return {
        type: 'StellarSetOptionsOp',
        source_account: op.source,
        signer_type: op.signer.type,
        signer_key: op.signer.key,
        signer_weight: op.signer.weight,
        clear_flags: op.clearFlags,
        set_flags: op.setFlags,
        master_weight: op.masterWeight,
        low_threshold: op.lowThreshold,
        medium_threshold: op.medThreshold,
        high_threshold: op.highThreshold,
        home_domain: op.homeDomain,
        inflation_destination_account: op.inflationDest
      };

    case 'changeTrust':
      (0, _paramsValidator.validateParams)(op, [{
        name: 'limit',
        type: 'amount'
      }]);
      return {
        type: 'StellarChangeTrustOp',
        source_account: op.source,
        asset: op.line,
        limit: parseInt(op.limit, 10)
      };

    case 'allowTrust':
      return {
        type: 'StellarAllowTrustOp',
        source_account: op.source,
        trusted_account: op.trustor,
        asset_type: op.assetType,
        asset_code: op.assetCode,
        is_authorized: op.authorize ? 1 : 0
      };

    case 'accountMerge':
      return {
        type: 'StellarAccountMergeOp',
        source_account: op.source,
        destination_account: op.destination
      };

    case 'manageData':
      return {
        type: 'StellarManageDataOp',
        source_account: op.source,
        key: op.name,
        value: op.value
      };

    case 'bumpSequence':
      return {
        type: 'StellarBumpSequenceOp',
        source_account: op.source,
        bump_to: op.to
      };
  }
};