import * as BN from 'bn.js';
import type {
    CoinSelectAlgorithm,
    CoinSelectOptions,
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOutputFinal,
} from './index';

// baseline estimates, used to improve performance
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4 + 1;
// 8 bytes start, 2 times 1 byte count in/out, 1 extra byte for segwit start
const TX_INPUT_BASE = 32 + 4 + 1 + 4;
const TX_OUTPUT_BASE = 8 + 1;
export const ZERO = new BN(0);

type VinVout = { script?: { length: number } };

export function inputBytes(input: VinVout) {
    if (!input.script?.length) {
        throw new Error('Null script length');
    }
    return TX_INPUT_BASE + input.script.length;
}

export function outputBytes(output: VinVout) {
    if (!output.script?.length) {
        throw new Error('Null script length');
    }
    return TX_OUTPUT_BASE + output.script.length;
}

export function transactionBytes(inputs: VinVout[], outputs: VinVout[]) {
    return (
        TX_EMPTY_SIZE +
        inputs.reduce((a, x) => a + inputBytes(x), 0) +
        outputs.reduce((a, x) => a + outputBytes(x), 0)
    );
}

export function dustThreshold(
    feeRate: number,
    inputLength: number,
    outputLength: number,
    explicitDustThreshold: number,
) {
    const size = transactionBytes(
        [
            {
                script: {
                    length: inputLength,
                },
            },
        ],
        [
            {
                script: {
                    length: outputLength,
                },
            },
        ],
    );
    const price = size * feeRate;
    const threshold = Math.max(explicitDustThreshold, price);
    return threshold;
}

export function uintOrNaN(v: number) {
    if (typeof v !== 'number') return;
    if (Number.isNaN(v) || !Number.isFinite(v) || !Number.isInteger(v) || v < 0) return;
    return v;
}

export function bignumberOrNaN(v?: BN | string): BN | undefined;
export function bignumberOrNaN<F extends boolean>(
    v?: BN | string,
    forgiving?: F,
): F extends true ? BN : BN | undefined;
export function bignumberOrNaN(v?: BN | string, forgiving = false) {
    if (BN.isBN(v)) return v;
    const defaultValue = forgiving ? ZERO : undefined;
    if (!v || typeof v !== 'string' || !/^\d+$/.test(v)) return defaultValue;

    try {
        return new BN(v);
    } catch (error) {
        return defaultValue;
    }
}

export function sumOrNaN(range: { value?: string }[]): BN | undefined;
export function sumOrNaN<F extends boolean>(
    range: { value?: string }[],
    forgiving: F,
): F extends true ? BN : BN | undefined;
export function sumOrNaN(range: { value?: string }[], forgiving = false) {
    return range.reduce((a: BN | undefined, x) => {
        if (!a) return a;
        const value = bignumberOrNaN(x.value);
        if (!value) return forgiving ? ZERO.add(a) : undefined;
        return value.add(a);
    }, ZERO);
}

// DOGE fee policy https://github.com/dogecoin/dogecoin/issues/1650#issuecomment-722229742
// 1 DOGE base fee + 1 DOGE per every started kb + 1 DOGE for every output below 1 DOGE (dust limit)
export function getFee(
    feeRate: number,
    bytes: number,
    options: Partial<CoinSelectOptions>,
    outputs: CoinSelectOutput[],
) {
    const defaultFee = feeRate * bytes;
    let baseFee = options.baseFee || 0;
    if (baseFee && bytes) {
        if (options.floorBaseFee) {
            // increase baseFee for every started kb
            baseFee *= Math.floor((baseFee + defaultFee) / baseFee);
        } else {
            // simple increase baseFee
            baseFee += defaultFee;
        }
    }
    if (options.dustOutputFee && options.dustThreshold) {
        // find all outputs below dust limit
        for (let i = 0; i < outputs.length; i++) {
            const { value } = outputs[i];
            if (value && new BN(value).sub(new BN(options.dustThreshold)).isNeg()) {
                // increase for every output below dustThreshold
                baseFee += options.dustOutputFee;
            }
        }
    }
    return baseFee || defaultFee;
}

export function finalize(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) {
    const { inputLength, changeOutputLength, dustThreshold: explicitDustThreshold } = options;
    const bytesAccum = transactionBytes(inputs, outputs);
    const blankOutputBytes = outputBytes({ script: { length: changeOutputLength } });
    const fee = getFee(feeRate, bytesAccum, options, outputs);
    const feeAfterExtraOutput = getFee(feeRate, bytesAccum + blankOutputBytes, options, outputs);
    const sumInputs = sumOrNaN(inputs);
    const sumOutputs = sumOrNaN(outputs);
    // if sum inputs/outputs is NaN
    // or `fee` is greater than sum of inputs reduced by sum of outputs (use case: baseFee)
    // no further calculation required (not enough funds)
    if (!sumInputs || !sumOutputs || sumInputs.sub(sumOutputs).lt(new BN(fee))) {
        return { fee };
    }

    const remainderAfterExtraOutput = sumInputs.sub(sumOutputs.add(new BN(feeAfterExtraOutput)));
    const dust = dustThreshold(feeRate, inputLength, changeOutputLength, explicitDustThreshold);

    const finalOutputs: CoinSelectOutputFinal[] = outputs.map(o =>
        Object.assign({}, o, {
            value: o.value as string, // it's verified that output have value (sumOutputs) TODO: refactor sumOrNaN to return correct type (outputs with values)
        }),
    );

    // is it worth a change output?
    if (remainderAfterExtraOutput.gt(new BN(dust))) {
        finalOutputs.push({
            value: remainderAfterExtraOutput.toString(),
            script: {
                length: changeOutputLength,
            },
        });
    }

    return {
        inputs,
        outputs: finalOutputs,
        fee: sumInputs.sub(sumOrNaN(finalOutputs, true)).toNumber(), // it's verified that output have value (sumOutputs) TODO: refactor sumOrNaN to return correct type (outputs with values)
    };
}

export function anyOf(algorithms: CoinSelectAlgorithm[]): CoinSelectAlgorithm {
    return (utxos, outputs, feeRate, options) => {
        let result: ReturnType<CoinSelectAlgorithm> = { fee: 0 };

        for (let i = 0; i < algorithms.length; i++) {
            const algorithm = algorithms[i];
            result = algorithm(utxos, outputs, feeRate, options);
            if (result.inputs) {
                return result;
            }
        }

        return result;
    };
}

export function utxoScore(x: CoinSelectInput, feeRate: number) {
    return new BN(x.value).sub(new BN(feeRate * inputBytes(x)));
}

export function sortByScore(feeRate: number) {
    return (a: CoinSelectInput, b: CoinSelectInput) => {
        const difference = utxoScore(a, feeRate).sub(utxoScore(b, feeRate));
        if (difference.eq(ZERO)) {
            return a.i - b.i;
        }
        return difference.isNeg() ? 1 : -1;
    };
}

export function filterCoinbase(utxos: CoinSelectInput[], minConfCoinbase: number) {
    return utxos.filter(utxo => {
        if (utxo.coinbase && !utxo.required) {
            return utxo.confirmations >= minConfCoinbase;
        }
        return true;
    });
}
