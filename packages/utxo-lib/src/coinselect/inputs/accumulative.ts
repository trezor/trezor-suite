import BN from 'bn.js';
import {
    bignumberOrNaN,
    sumOrNaN,
    inputBytes,
    getFee,
    getFeeForBytes,
    finalize,
    ZERO,
} from '../coinselectUtils';
import {
    CoinSelectOptions,
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectResult,
} from '../../types';

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
export function accumulative(
    utxos0: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
    let inAccum = ZERO;
    const inputs: CoinSelectInput[] = [];
    const outAccum = sumOrNaN(outputs);

    // split utxos into required and the rest
    const requiredUtxos: CoinSelectInput[] = [];
    const utxos: CoinSelectInput[] = [];
    utxos0.forEach(u => {
        if (u.required) {
            requiredUtxos.push(u);
            const utxoValue = bignumberOrNaN(u.value, true); // use forgiving (0)
            inAccum = inAccum.add(utxoValue);
            inputs.push(u);
        } else {
            utxos.push(u);
        }
    });

    // check if required utxo is enough
    if (requiredUtxos.length > 0) {
        const requiredIsEnough = finalize(requiredUtxos, outputs, feeRate, options);
        if (requiredIsEnough.inputs) {
            return requiredIsEnough;
        }
    }

    // continue with the rest
    for (let i = 0; i < utxos.length; ++i) {
        const utxo = utxos[i];
        const utxoBytes = inputBytes(utxo);
        const utxoFee = getFeeForBytes(feeRate, utxoBytes);
        const utxoValue = bignumberOrNaN(utxo.value);

        // skip detrimental input
        if (!utxoValue || utxoValue.lt(new BN(utxoFee))) {
            if (i === utxos.length - 1) {
                const fee = getFee([...inputs, utxo], outputs, feeRate, options);

                return { fee };
            }
        } else {
            inAccum = inAccum.add(utxoValue);
            inputs.push(utxo);

            const fee = getFee(inputs, outputs, feeRate, options);
            const outAccumWithFee = outAccum ? outAccum.add(new BN(fee)) : ZERO;

            // go again?
            if (inAccum.gte(outAccumWithFee)) {
                return finalize(inputs, outputs, feeRate, options);
            }
        }
    }

    const fee = getFee(inputs, outputs, feeRate, options);

    return { fee };
}
