import * as utils from '../utils';

function filterCoinbase(utxos, minConfCoinbase) {
    return utxos.filter((utxo) => {
        if (utxo.coinbase) {
            return utxo.confirmations >= minConfCoinbase;
        }
        return true;
    });
}

// split utxos between each output, ignores outputs with .value defined
export default function split(utxosOrig, outputs, feeRate, options) {
    const {
        inputLength,
        changeOutputLength,
        dustThreshold: explicitDustThreshold,
    } = options;
    const coinbase = options.coinbase || 100;

    if (!Number.isFinite(utils.uintOrNaN(feeRate))) return {};

    const utxos = filterCoinbase(utxosOrig, coinbase);

    const bytesAccum = utils.transactionBytes(utxos, outputs);
    const fee = feeRate * bytesAccum;
    if (outputs.length === 0) return { fee };

    const inAccum = utils.sumOrNaN(utxos);
    const outAccum = utils.sumForgiving(outputs);
    const remaining = inAccum - outAccum - fee;
    if (!Number.isFinite(remaining) || remaining < 0) return { fee };

    const unspecified = outputs.reduce((a, x) => a + !Number.isFinite(x.value), 0);

    if (remaining === 0 && unspecified === 0) {
        return utils.finalize(utxos, outputs, feeRate, inputLength, changeOutputLength);
    }

    const splitOutputsCount = outputs.reduce((a, x) => a + !Number.isFinite(x.value), 0);
    const splitValue = Math.floor(remaining / splitOutputsCount);

    // ensure every output is either user defined, or over the threshold
    if (!outputs.every(x => x.value !== undefined
        || (
            splitValue > utils.dustThreshold(
                feeRate,
                inputLength,
                changeOutputLength,
                explicitDustThreshold,
            )
        ))) return { fee };

    // assign splitValue to outputs not user defined
    const outputsSplit = outputs.map((x) => {
        if (x.value !== undefined) return x;

        // not user defined, but still copy over any non-value fields
        const y = {};
        Object.keys(x).forEach((k) => { y[k] = x[k]; });
        y.value = splitValue;
        return y;
    });

    return utils.finalize(
        utxos,
        outputsSplit,
        feeRate,
        inputLength,
        changeOutputLength,
        explicitDustThreshold,
    );
}
