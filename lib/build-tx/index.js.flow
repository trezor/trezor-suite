'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BuildTxTransaction = exports.BuildTxResult = exports.BuildTxOutputRequest = exports.BuildTxRequest = exports.BuildTxEmptyResult = undefined;

var _result = require('./result');

Object.defineProperty(exports, 'BuildTxEmptyResult', {
    enumerable: true,
    get: function get() {
        return _result.empty;
    }
});

var _request = require('./request');

Object.defineProperty(exports, 'BuildTxRequest', {
    enumerable: true,
    get: function get() {
        return _request.Request;
    }
});
Object.defineProperty(exports, 'BuildTxOutputRequest', {
    enumerable: true,
    get: function get() {
        return _request.OutputRequest;
    }
});
Object.defineProperty(exports, 'BuildTxResult', {
    enumerable: true,
    get: function get() {
        return _result.Result;
    }
});

var _transaction = require('./transaction');

Object.defineProperty(exports, 'BuildTxTransaction', {
    enumerable: true,
    get: function get() {
        return _transaction.Transaction;
    }
});
exports.buildTx = buildTx;

var request = _interopRequireWildcard(_request);

var result = _interopRequireWildcard(_result);

var transaction = _interopRequireWildcard(_transaction);

var _coinselect = require('./coinselect');

var coinselect = _interopRequireWildcard(_coinselect);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function buildTx(_ref) {
    var utxos = _ref.utxos,
        outputs = _ref.outputs,
        height = _ref.height,
        feeRate = _ref.feeRate,
        segwit = _ref.segwit,
        inputAmounts = _ref.inputAmounts,
        basePath = _ref.basePath,
        network = _ref.network,
        changeId = _ref.changeId,
        changeAddress = _ref.changeAddress,
        dustThreshold = _ref.dustThreshold;

    if (outputs.length === 0) {
        return result.empty;
    }
    if (utxos.length === 0) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    var countMax = { exists: false, id: 0 };
    try {
        countMax = request.getMax(outputs);
    } catch (e) {
        return { type: 'error', error: e.message };
    }
    var splitOutputs = request.splitByCompleteness(outputs);

    var csResult = { type: 'false' };
    try {
        csResult = coinselect.coinselect(utxos, outputs, height, feeRate, segwit, countMax.exists, countMax.id, dustThreshold);
    } catch (e) {
        return { type: 'error', error: e.message };
    }

    if (csResult.type === 'false') {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    } else {
        if (splitOutputs.incomplete.length > 0) {
            return result.getNonfinalResult(csResult);
        }

        var resTransaction = transaction.createTransaction(utxos, csResult.result.inputs, splitOutputs.complete, csResult.result.outputs, segwit, inputAmounts, basePath, changeId, changeAddress, network);
        return result.getFinalResult(csResult, resTransaction);
    }
}