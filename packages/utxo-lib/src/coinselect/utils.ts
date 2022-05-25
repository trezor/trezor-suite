import * as BN from 'bn.js';
import type {
    CoinSelectAlgorithm,
    CoinSelectOptions,
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOutputFinal,
} from './index';

export const ZERO = new BN(0);

// TODO: p2ms, external, p2wsh. currently not used in suite/connect.
export const INPUT_SCRIPT_LENGTH = {
    p2pkh: 108, //  1 + 72 (DER signature) + 1 + 33 (PUBKEY) + 1 script varInt size
    p2sh: 107, //   1 + 72 (DER signature) + 1 + 33 (PUBKEY)
    p2tr: 65, //    1 + 64 (SCHNORR signature)
    p2wpkh: 107, // 1 + 72 (DER signature) + 1 + 33 (PUBKEY)
} as const;

export const OUTPUT_SCRIPT_LENGTH = {
    p2pkh: 25,
    p2sh: 23,
    p2tr: 34,
    p2wpkh: 22,
    p2wsh: 34,
} as const;

export type TxType = keyof typeof INPUT_SCRIPT_LENGTH;

const SEGWIT_INPUT_SCRIPT_TYPES: TxType[] = ['p2sh', 'p2tr', 'p2wpkh'];

// transaction header + footer: 4 byte version, 4 byte lock time
const TX_BASE = 32; // 4 * (4 + 4)

// transaction input size (without script): 32 prevhash, 4 idx, 4 sequence
const INPUT_SIZE = 160; // 4 * (32 + 4 + 4)

type Vin = { type: CoinSelectInput['type']; script: { length: number }; weight?: number };
type VinVout = { script: { length: number }; weight?: number };

export function getVarIntSize(length: number) {
    if (length < 253) return 1;
    if (length < 65536) return 3;
    return 5;
}

export function inputWeight(input: Vin) {
    if (input.weight) return input.weight; // weight may be pre-calculated. see ../compose/utils convertInput
    let weight = INPUT_SIZE;
    if (!SEGWIT_INPUT_SCRIPT_TYPES.includes(input.type)) {
        weight += 4 * input.script.length;
    } else {
        if (input.type === 'p2sh') {
            // script sig. size
            weight += 4 * (2 + 22);
        } else {
            weight += 4; // empty script_sig (1 byte)
        }
        weight += 1 + input.script.length; // discounted witness
    }
    return weight;
}

export function inputBytes(input: Vin) {
    return Math.ceil(inputWeight(input) / 4);
}

export function outputWeight(output: VinVout) {
    if (output.weight) return output.weight; // weight may be pre-calculated. see ../compose/utils convertOutput
    return 4 * (8 + 1 + output.script.length);
}

export function outputBytes(output: VinVout) {
    return Math.ceil(outputWeight(output) / 4);
}

export function getFeeForBytes(feeRate: number, bytes: number) {
    return Math.ceil(feeRate * bytes);
}

export function transactionWeight(inputs: Vin[], outputs: VinVout[]) {
    const segwitInputs = inputs.reduce(
        (x, i) => x + (SEGWIT_INPUT_SCRIPT_TYPES.includes(i.type) ? 1 : 0),
        0,
    );

    return (
        TX_BASE +
        4 * getVarIntSize(inputs.length) +
        inputs.reduce((x, i) => x + inputWeight(i), 0) +
        4 * getVarIntSize(outputs.length) +
        outputs.reduce((x, o) => x + outputWeight(o), 0) +
        (segwitInputs ? 2 + (inputs.length - segwitInputs) : 0)
    );
}

export function transactionBytes(inputs: Vin[], outputs: VinVout[]) {
    return Math.ceil(transactionWeight(inputs, outputs) / 4);
}

export function dustThreshold(feeRate: number, options: CoinSelectOptions) {
    const size = transactionBytes(
        [
            {
                type: options.txType,
                script: {
                    length: INPUT_SCRIPT_LENGTH[options.txType],
                },
            },
        ],
        [
            {
                script: {
                    length: OUTPUT_SCRIPT_LENGTH[options.txType],
                },
            },
        ],
    );
    const price = getFeeForBytes(feeRate, size);
    return Math.max(options.dustThreshold, price);
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
    const defaultFee = getFeeForBytes(feeRate, bytes);
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
    const bytesAccum = transactionBytes(inputs, outputs);
    const blankOutputBytes = outputBytes({
        script: { length: OUTPUT_SCRIPT_LENGTH[options.txType] },
    });
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
    const dust = dustThreshold(feeRate, options);

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
                length: OUTPUT_SCRIPT_LENGTH[options.txType],
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
    return new BN(x.value).sub(new BN(getFeeForBytes(feeRate, inputBytes(x))));
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
