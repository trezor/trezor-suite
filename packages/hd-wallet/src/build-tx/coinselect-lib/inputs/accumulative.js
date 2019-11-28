import * as utils from '../utils';

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
export default function accumulative(utxos, outputs, feeRate, options) {
    const { changeOutputLength, dustThreshold: explicitDustThreshold, inputLength } = options;

    if (!Number.isFinite(utils.uintOrNaN(feeRate))) return {};
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
        } else {
            bytesAccum += utxoBytes;
            inAccum += utxoValue;
            inputs.push(utxo);

            const fee = feeRate * bytesAccum;

            // go again?
            if (!(inAccum < outAccum + fee)) {
                return utils.finalize(
                    inputs,
                    outputs,
                    feeRate,
                    inputLength,
                    changeOutputLength,
                    explicitDustThreshold,
                );
            }
        }
    }

    return { fee: feeRate * bytesAccum };
}
