const utils = require('../utils');

// split utxos between each output, ignores outputs with .value defined
module.exports = function split(utxos, outputs, feeRate, options) {
    const inputLength = options.inputLength;
    const outputLength = options.outputLength;
    const explicitDustThreshold = options.dustThreshold;

    if (!isFinite(utils.uintOrNaN(feeRate))) return {};

    const bytesAccum = utils.transactionBytes(utxos, outputs);
    const fee = feeRate * bytesAccum;
    if (outputs.length === 0) return { fee: fee };

    const inAccum = utils.sumOrNaN(utxos);
    const outAccum = utils.sumForgiving(outputs);
    const remaining = inAccum - outAccum - fee;
    if (!isFinite(remaining) || remaining < 0) return { fee: fee };

    const unspecified = outputs.reduce(function (a, x) {
        return a + !isFinite(x.value);
    }, 0);

    if (remaining === 0 && unspecified === 0) return utils.finalize(utxos, outputs, feeRate, inputLength, outputLength);

    const splitOutputsCount = outputs.reduce(function (a, x) {
        return a + !x.value;
    }, 0);
    const splitValue = (remaining / splitOutputsCount) >>> 0;

    // ensure every output is either user defined, or over the threshold
    if (!outputs.every(function (x) {
        return x.value !== undefined || (splitValue > utils.dustThreshold(feeRate, inputLength));
    })) return { fee: fee };

    // assign splitValue to outputs not user defined
    outputs = outputs.map(function (x) {
        if (x.value !== undefined) return x;

        // not user defined, but still copy over any non-value fields
        const y = {};
        for (const k in x) y[k] = x[k];
        y.value = splitValue;
        return y;
    });

    return utils.finalize(utxos, outputs, feeRate, inputLength, outputLength, explicitDustThreshold);
};
