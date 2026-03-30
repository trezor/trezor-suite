import {
    MINIMAL_COINBASE_CONFIRMATIONS,
    bignumberOrNaN,
    filterCoinbase,
    finalize,
    getDustAmount,
    getFee,
    sumOrNaN,
} from '../coinselectUtils';
import {
    type CoinSelectInput,
    type CoinSelectOptions,
    type CoinSelectOutput,
    type CoinSelectResult,
} from '../types';

// split utxos between each output, ignores outputs with .value defined
export function split(
    utxosOrig: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
    const coinbase = options.coinbase || MINIMAL_COINBASE_CONFIRMATIONS;
    const utxos = filterCoinbase(utxosOrig, coinbase);

    const fee = getFee(utxos, outputs, feeRate, options);
    if (outputs.length === 0) return { fee };

    const inAccum = sumOrNaN(utxos);
    const outAccum = sumOrNaN(outputs, true);
    if (inAccum === undefined) return { fee };

    const remaining = inAccum - outAccum - BigInt(fee);
    if (remaining < 0n) return { fee };

    const unspecified = outputs.reduce(
        (a, x) => a + (bignumberOrNaN(x.value) === undefined ? 1 : 0),
        0,
    );

    if (remaining === 0n || unspecified === 0) {
        return finalize(utxos, outputs, feeRate, options);
    }

    const splitValue = remaining / BigInt(unspecified);
    const dustAmount = getDustAmount(feeRate, options);

    // ensure every output is either user defined, or over the threshold
    if (unspecified && splitValue < BigInt(dustAmount)) return { fee };

    // assign splitValue to outputs not user defined
    const outputsSplit = outputs.map(output => {
        if (output.value !== undefined) return output;

        return {
            ...output,
            value: splitValue,
        };
    });

    return finalize(utxos, outputsSplit, feeRate, options);
}
