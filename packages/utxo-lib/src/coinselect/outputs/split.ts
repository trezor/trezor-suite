import * as BN from 'bn.js';
import * as utils from '../utils';
import type {
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOptions,
    CoinSelectResult,
} from '../index';

// split utxos between each output, ignores outputs with .value defined
export function split(
    utxosOrig: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
    if (typeof utils.uintOrNaN(feeRate) !== 'number') return { fee: 0 };

    const coinbase = options.coinbase || 100;
    const utxos = utils.filterCoinbase(utxosOrig, coinbase);

    const bytesAccum = utils.transactionBytes(utxos, outputs);
    const fee = utils.getFee(feeRate, bytesAccum, options, outputs);
    if (outputs.length === 0) return { fee };

    const inAccum = utils.sumOrNaN(utxos);
    const outAccum = utils.sumOrNaN(outputs, true);
    if (!inAccum) return { fee };

    const remaining = inAccum.sub(outAccum).sub(new BN(fee));
    if (remaining.lt(utils.ZERO)) return { fee };

    const unspecified = outputs.reduce((a, x) => a + (!utils.bignumberOrNaN(x.value) ? 1 : 0), 0);

    if (remaining.isZero() && unspecified === 0) {
        return utils.finalize(utxos, outputs, feeRate, options);
    }

    const splitValue = remaining.div(new BN(unspecified));
    const dustThreshold = utils.dustThreshold(
        feeRate,
        options.inputLength,
        options.changeOutputLength,
        options.dustThreshold,
    );

    // ensure every output is either user defined, or over the threshold
    if (unspecified && splitValue.lte(new BN(dustThreshold))) return { fee };

    // assign splitValue to outputs not user defined
    const outputsSplit = outputs.map(x => {
        if (x.value) return x;

        // not user defined, but still copy over any non-value fields
        const y = Object.assign({}, x);
        y.value = splitValue.toString();
        return y;
    });

    return utils.finalize(utxos, outputsSplit, feeRate, options);
}
