const utils = require('../utils');

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
module.exports = function accumulative(utxos, outputs, feeRate, options) {
    const inputLength = options.inputLength;
    const outputLength = options.outputLength;
    const explicitDustThreshold = options.dustThreshold;

    if (!isFinite(utils.uintOrNaN(feeRate))) return {};
    let bytesAccum = utils.transactionBytes([], outputs);

    let inAccum = 0;
    const inputs = [];
    const outAccum = utils.sumOrNaN(outputs);

    for (let i = 0; i < utxos.length; ++i) {
        const utxo = utxos[i];
        const utxoBytes = utils.inputBytes(utxo);
        const utxoFee = feeRate * utxoBytes;
        const utxoValue = utils.uintOrNaN(utxo.value);

        // skip detrimental input
        if (utxoFee > utxo.value) {
            if (i === utxos.length - 1) return { fee: feeRate * (bytesAccum + utxoBytes) };
            continue;
        }

        bytesAccum += utxoBytes;
        inAccum += utxoValue;
        inputs.push(utxo);

        const fee = feeRate * bytesAccum;

        // go again?
        if (inAccum < outAccum + fee) continue;

        return utils.finalize(inputs, outputs, feeRate, inputLength, outputLength, explicitDustThreshold);
    }

    return { fee: feeRate * bytesAccum };
};
