import BN from 'bn.js';
import {
    CoinSelectPaymentType,
    CoinSelectAlgorithm,
    CoinSelectOptions,
    CoinSelectInput,
    CoinSelectOutput,
    CoinSelectOutputFinal,
} from '../types';
import { Network, isNetworkType } from '../networks';

export const ZERO = new BN(0);

// TODO: p2ms, external, p2wsh. currently not used in suite/connect.
export const INPUT_SCRIPT_LENGTH: Record<CoinSelectPaymentType, number> = {
    p2pkh: 108, //  1 + 72 (DER signature) + 1 + 33 (PUBKEY) + 1 script varInt size
    p2sh: 107, //   1 + 72 (DER signature) + 1 + 33 (PUBKEY)
    p2tr: 65, //    1 + 64 (SCHNORR signature)
    p2wpkh: 107, // 1 + 72 (DER signature) + 1 + 33 (PUBKEY)
    p2wsh: 107, // TODO usually 1 + 72 + 1 + 72 + 1 + 70
} as const;

export const OUTPUT_SCRIPT_LENGTH: Record<CoinSelectPaymentType, number> = {
    p2pkh: 25,
    p2sh: 23,
    p2tr: 34,
    p2wpkh: 22,
    p2wsh: 34,
} as const;

const SEGWIT_INPUT_SCRIPT_TYPES: CoinSelectPaymentType[] = ['p2sh', 'p2tr', 'p2wpkh', 'p2wsh'];

// transaction header + footer: 4 byte version, 4 byte lock time
const TX_BASE = 32; // 4 * (4 + 4)

// transaction input size (without script): 32 prevhash, 4 idx, 4 sequence
const INPUT_SIZE = 160; // 4 * (32 + 4 + 4)

const DUST_RELAY_FEE_RATE = 3; // 3000 sat/kB https://github.com/bitcoin/bitcoin/blob/be443328037162f265cc85d05b1a7665b5f104d2/src/policy/policy.h#L55

type Vin = { type: CoinSelectInput['type']; script: { length: number }; weight?: number };
type VinVout = { script: { length: number }; weight?: number };

export function getVarIntSize(length: number) {
    if (length < 253) return 1;
    if (length < 65536) return 3;
    if (length < 4294967296) return 5;

    return 9;
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
    const segwitInputs = inputs.filter(i => SEGWIT_INPUT_SCRIPT_TYPES.includes(i.type)).length;

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

// https://github.com/bitcoin/bitcoin/blob/be443328037162f265cc85d05b1a7665b5f104d2/src/policy/policy.cpp#L28-L41
// Absolute minimum accepted dustRelayFeeRate is set to 3 sat/byte (3000 sat/kB) in bitcoin-core.
// To make potential output spendable in the near future it could be slightly higher basing on longTermFeeRate (if provided)
// Minimum dust amount is the greater value from:
// - provided constant `dustThreshold` (typically 546 sat. with few exceptions like DOGE)
// - calculated from inputSize multiplied by dustRelayFeeRate
export function getDustAmount(
    feeRate: number,
    { txType, longTermFeeRate, dustThreshold }: CoinSelectOptions,
) {
    const inputSize = inputBytes({
        type: txType,
        script: {
            length: INPUT_SCRIPT_LENGTH[txType],
        },
    });
    // use current feeRate if it is lower than longTermFeeRate
    const longTermFee = longTermFeeRate ? Math.min(feeRate, longTermFeeRate) : 0;
    // use default dust relay fee if it is lower than long term fee
    const dustRelayFeeRate = Math.max(longTermFee, DUST_RELAY_FEE_RATE);

    // use explicit dustThreshold if it is higher than calculated from script type
    return Math.max(dustThreshold || 0, getFeeForBytes(dustRelayFeeRate, inputSize));
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

export function sumOrNaN(range: { value?: BN }[]): BN | undefined;
export function sumOrNaN<F extends boolean>(
    range: { value?: BN }[],
    forgiving: F,
): F extends true ? BN : BN | undefined;
export function sumOrNaN(range: { value?: BN }[], forgiving = false) {
    return range.reduce((a: BN | undefined, x) => {
        if (!a) return a;
        const value = bignumberOrNaN(x.value);
        if (!value) return forgiving ? ZERO.add(a) : undefined;

        return value.add(a);
    }, ZERO);
}

export function getFeePolicy(network?: Network) {
    if (isNetworkType('doge', network)) return 'doge';
    if (isNetworkType('zcash', network)) return 'zcash';

    return 'bitcoin';
}

function getBitcoinFee(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    { baseFee = 0, floorBaseFee }: Partial<CoinSelectOptions>,
) {
    const bytes = transactionBytes(inputs, outputs);
    const defaultFee = getFeeForBytes(feeRate, bytes);

    return baseFee && floorBaseFee
        ? // increase baseFee for every started kb
          baseFee * (1 + Math.floor(defaultFee / baseFee))
        : // simple increase baseFee
          baseFee + defaultFee;
}

// DOGE fee policy https://github.com/dogecoin/dogecoin/blob/3a29ba6d497cd1d0a32ecb039da0d35ea43c9c85/doc/fee-recommendation.md
// 0.01 DOGE per every started kb + 0.01 DOGE for every output below 0.01 DOGE (dust limit)
function getDogeFee(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    { dustThreshold = 0, ...options }: Partial<CoinSelectOptions>,
) {
    const fee = getBitcoinFee(inputs, outputs, feeRate, options);

    // find all outputs below dust limit
    const limit = new BN(dustThreshold);
    const dustOutputsCount = outputs.filter(({ value }) => value && value.lt(limit)).length;

    // increase for every output below dustThreshold
    return fee + dustOutputsCount * dustThreshold;
}

const MARGINAL_FEE_ZAT_PER_ACTION = 5000;
const GRACE_ACTIONS = 2;
const P2PKH_STANDARD_INPUT_SIZE = 150;
const P2PKH_STANDARD_OUTPUT_SIZE = 34;

// ZCASH fee policy https://github.com/zcash/zips/blob/c6086941577b711ada286b7c82466a92105ad066/zip-0317.rst
// 5000 zat per every input or output (whichever there's more of, but at least 2), Orchard/Sapling currently ignored
function getZcashFee(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: Partial<CoinSelectOptions>,
) {
    const fee = getBitcoinFee(inputs, outputs, feeRate, options);

    const txInTotalBytes = inputs.reduce((sum, i) => sum + inputBytes(i), 0);
    const txOutTotalBytes = outputs.reduce((sum, o) => sum + outputBytes(o), 0);
    const actions = Math.max(
        GRACE_ACTIONS,
        Math.ceil(txInTotalBytes / P2PKH_STANDARD_INPUT_SIZE),
        Math.ceil(txOutTotalBytes / P2PKH_STANDARD_OUTPUT_SIZE),
    );

    // Use the greater from standard fee and zip-317 calculated fee
    return Math.max(actions * MARGINAL_FEE_ZAT_PER_ACTION, fee);
}

export function getFee(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    { feePolicy, ...options }: Partial<CoinSelectOptions> = {},
) {
    switch (feePolicy) {
        case 'doge':
            return getDogeFee(inputs, outputs, feeRate, options);
        case 'zcash':
            return getZcashFee(inputs, outputs, feeRate, options);
        default:
            return getBitcoinFee(inputs, outputs, feeRate, options);
    }
}

export function finalize(
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) {
    const changeOutput = options.changeOutput || {
        script: { length: OUTPUT_SCRIPT_LENGTH[options.txType] },
    };
    const fee = getFee(inputs, outputs, feeRate, options);
    const feeAfterExtraOutput = getFee(inputs, [...outputs, changeOutput], feeRate, options);
    const sumInputs = sumOrNaN(inputs);
    const sumOutputs = sumOrNaN(outputs);
    // if sum inputs/outputs is NaN
    // or `fee` is greater than sum of inputs reduced by sum of outputs (use case: baseFee)
    // no further calculation required (not enough funds)
    if (!sumInputs || !sumOutputs || sumInputs.sub(sumOutputs).lt(new BN(fee))) {
        return { fee };
    }

    const remainderAfterExtraOutput = sumInputs.sub(sumOutputs.add(new BN(feeAfterExtraOutput)));
    const dustAmount = getDustAmount(feeRate, options);

    // it's verified that output have value (sumOutputs)
    const finalOutputs = [...(outputs as CoinSelectOutputFinal[])];

    // is it worth a change output?
    if (remainderAfterExtraOutput.gte(new BN(dustAmount))) {
        finalOutputs.push({
            ...changeOutput,
            value: remainderAfterExtraOutput,
        });
    }

    return {
        inputs,
        outputs: finalOutputs,
        fee: sumInputs.sub(sumOrNaN(finalOutputs, true)).toNumber(),
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
    return x.value.sub(new BN(getFeeForBytes(feeRate, inputBytes(x))));
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
