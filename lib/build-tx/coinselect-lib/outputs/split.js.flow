'use strict';

var utils = require('../utils');

function filterCoinbase(utxos, minConfCoinbase) {
    return utxos.filter(function (utxo) {
        if (utxo.coinbase) {
            return utxo.confirmations >= minConfCoinbase;
        }
        return true;
    });
}

// split utxos between each output, ignores outputs with .value defined
module.exports = function split(utxos, outputs, feeRate, options) {
    var inputLength = options.inputLength;
    var outputLength = options.outputLength;
    var explicitDustThreshold = options.dustThreshold;
    var coinbase = options.coinbase || 100;

    if (!isFinite(utils.uintOrNaN(feeRate))) return {};

    utxos = filterCoinbase(utxos, coinbase);

    var bytesAccum = utils.transactionBytes(utxos, outputs);
    var fee = feeRate * bytesAccum;
    if (outputs.length === 0) return { fee: fee };

    var inAccum = utils.sumOrNaN(utxos);
    var outAccum = utils.sumForgiving(outputs);
    var remaining = inAccum - outAccum - fee;
    if (!isFinite(remaining) || remaining < 0) return { fee: fee };

    var unspecified = outputs.reduce(function (a, x) {
        return a + !isFinite(x.value);
    }, 0);

    if (remaining === 0 && unspecified === 0) return utils.finalize(utxos, outputs, feeRate, inputLength, outputLength);

    var splitOutputsCount = outputs.reduce(function (a, x) {
        return a + !isFinite(x.value);
    }, 0);
    var splitValue = Math.floor(remaining / splitOutputsCount);

    // ensure every output is either user defined, or over the threshold
    if (!outputs.every(function (x) {
        return x.value !== undefined || splitValue > utils.dustThreshold(feeRate, inputLength, outputLength, explicitDustThreshold);
    })) return { fee: fee };

    // assign splitValue to outputs not user defined
    outputs = outputs.map(function (x) {
        if (x.value !== undefined) return x;

        // not user defined, but still copy over any non-value fields
        var y = {};
        for (var k in x) {
            y[k] = x[k];
        }y.value = splitValue;
        return y;
    });

    return utils.finalize(utxos, outputs, feeRate, inputLength, outputLength, explicitDustThreshold);
};