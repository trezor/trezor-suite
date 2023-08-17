import * as BN from 'bn.js';
import {
    bignumberOrNaN,
    sumOrNaN,
    transactionBytes,
    filterCoinbase,
    getDustAmount,
    getFee,
    finalize,
    ZERO,
} from '../coinselectUtils';
import {
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOptions,
    CoinSelectResult,
} from '../../types';

// split utxos between each output, ignores outputs with .value defined
export function split(
    utxosOrig: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
    const coinbase = options.coinbase || 100;
    const utxos = filterCoinbase(utxosOrig, coinbase);

    const bytesAccum = transactionBytes(utxos, outputs);
    const fee = getFee(feeRate, bytesAccum, options, outputs);
    if (outputs.length === 0) return { fee };

    const inAccum = sumOrNaN(utxos);
    const outAccum = sumOrNaN(outputs, true);
    if (!inAccum) return { fee };

    const remaining = inAccum.sub(outAccum).sub(new BN(fee));
    if (remaining.lt(ZERO)) return { fee };

    const unspecified = outputs.reduce((a, x) => a + (!bignumberOrNaN(x.value) ? 1 : 0), 0);

    if (remaining.isZero() || unspecified === 0) {
        return finalize(utxos, outputs, feeRate, options);
    }

    const splitValue = remaining.div(new BN(unspecified));
    const dustAmount = getDustAmount(feeRate, options);

    // ensure every output is either user defined, or over the threshold
    if (unspecified && splitValue.lt(new BN(dustAmount))) return { fee };

    // assign splitValue to outputs not user defined
    const outputsSplit = outputs.map(x => {
        if (x.value) return x;

        // not user defined, but still copy over any non-value fields
        const y = Object.assign({}, x);
        y.value = splitValue.toString();
        return y;
    });

    return finalize(utxos, outputsSplit, feeRate, options);
}
