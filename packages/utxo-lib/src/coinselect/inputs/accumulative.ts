import * as BN from 'bn.js';
import * as utils from '../utils';
import type {
    CoinSelectOptions,
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectResult,
} from '../index';

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
export function accumulative(
    utxos0: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
): CoinSelectResult {
    if (typeof utils.uintOrNaN(feeRate) !== 'number') return { fee: 0 };

    let bytesAccum = utils.transactionBytes([], outputs);
    let inAccum = utils.ZERO;
    const inputs: CoinSelectInput[] = [];
    const outAccum = utils.sumOrNaN(outputs);

    // split utxos into required and the rest
    const requiredUtxos: CoinSelectInput[] = [];
    const utxos: CoinSelectInput[] = [];
    utxos0.forEach(u => {
        if (u.required) {
            requiredUtxos.push(u);
            const utxoBytes = utils.inputBytes(u);
            const utxoValue = utils.bignumberOrNaN(u.value, true); // use forgiving (0)
            bytesAccum += utxoBytes;
            inAccum = inAccum.add(utxoValue);
            inputs.push(u);
        } else {
            utxos.push(u);
        }
    });

    // check if required utxo is enough
    if (requiredUtxos.length > 0) {
        const requiredIsEnough = utils.finalize(requiredUtxos, outputs, feeRate, options);
        if (requiredIsEnough.inputs) {
            return requiredIsEnough;
        }
    }

    // continue with the rest
    for (let i = 0; i < utxos.length; ++i) {
        const utxo = utxos[i];
        const utxoBytes = utils.inputBytes(utxo);
        const utxoFee = feeRate * utxoBytes;
        const utxoValue = utils.bignumberOrNaN(utxo.value);

        // skip detrimental input
        if (!utxoValue || utxoValue.lt(new BN(utxoFee))) {
            if (i === utxos.length - 1) {
                const fee = utils.getFee(feeRate, bytesAccum + utxoBytes, options, outputs);
                return { fee };
            }
        } else {
            bytesAccum += utxoBytes;
            inAccum = inAccum.add(utxoValue);
            inputs.push(utxo);

            const fee = utils.getFee(feeRate, bytesAccum, options, outputs);
            const outAccumWithFee = outAccum ? outAccum.add(new BN(fee)) : utils.ZERO;

            // go again?
            if (inAccum.gte(outAccumWithFee)) {
                return utils.finalize(inputs, outputs, feeRate, options);
            }
        }
    }

    const fee = utils.getFee(feeRate, bytesAccum, options, outputs);
    return { fee };
}
