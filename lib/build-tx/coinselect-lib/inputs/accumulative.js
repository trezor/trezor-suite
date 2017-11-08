'use strict';

var utils = require('../utils');

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
module.exports = function accumulative(utxos, outputs, feeRate, options) {
    var inputLength = options.inputLength;
    var outputLength = options.outputLength;
    var explicitDustThreshold = options.dustThreshold;

    if (!isFinite(utils.uintOrNaN(feeRate))) return {};
    var bytesAccum = utils.transactionBytes([], outputs);

    var inAccum = 0;
    var inputs = [];
    var outAccum = utils.sumOrNaN(outputs);

    for (var i = 0; i < utxos.length; ++i) {
        var utxo = utxos[i];
        var utxoBytes = utils.inputBytes(utxo);
        var utxoFee = feeRate * utxoBytes;
        var utxoValue = utils.uintOrNaN(utxo.value);

        // skip detrimental input
        if (utxoFee > utxo.value) {
            if (i === utxos.length - 1) return { fee: feeRate * (bytesAccum + utxoBytes) };
            continue;
        }

        bytesAccum += utxoBytes;
        inAccum += utxoValue;
        inputs.push(utxo);

        var fee = feeRate * bytesAccum;

        // go again?
        if (inAccum < outAccum + fee) continue;

        return utils.finalize(inputs, outputs, feeRate, inputLength, outputLength, explicitDustThreshold);
    }

    return { fee: feeRate * bytesAccum };
};