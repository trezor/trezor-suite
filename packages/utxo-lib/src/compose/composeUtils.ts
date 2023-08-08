import * as BitcoinJsAddress from '../address';
import {
    INPUT_SCRIPT_LENGTH,
    OUTPUT_SCRIPT_LENGTH,
    inputWeight,
    outputWeight,
} from '../coinselect/coinselectUtils';
import {
    CoinSelectPaymentType,
    CoinSelectInput,
    CoinSelectOutput,
    ComposeInput,
    ComposeOutput,
} from '../types';
import type { Network } from '../networks';

export function convertInputs(
    inputs: ComposeInput[],
    txType: CoinSelectPaymentType,
): CoinSelectInput[] {
    return inputs
        .map((input, i) => ({
            type: txType,
            i,
            script: { length: INPUT_SCRIPT_LENGTH[txType] },
            value: input.value,
            own: input.own,
            coinbase: input.coinbase,
            confirmations: input.confirmations,
            required: input.required,
        }))
        .map(input => Object.assign(input, { weight: inputWeight(input) }));
}

export function getScriptFromAddress(address: string, network: Network) {
    return {
        length: BitcoinJsAddress.toOutputScript(address, network).length,
    };
}

export function convertOutputs(
    outputs: ComposeOutput[],
    network: Network,
    txType: CoinSelectPaymentType,
): CoinSelectOutput[] {
    const script = { length: OUTPUT_SCRIPT_LENGTH[txType] };
    return outputs
        .map(output => {
            if (output.type === 'complete') {
                return {
                    value: output.amount,
                    script: getScriptFromAddress(output.address, network),
                };
            }
            if (output.type === 'noaddress') {
                return {
                    value: output.amount,
                    script,
                };
            }
            if (output.type === 'opreturn') {
                return {
                    value: '0',
                    script: { length: 2 + output.dataHex.length / 2 },
                };
            }
            if (output.type === 'send-max') {
                return {
                    script: getScriptFromAddress(output.address, network),
                };
            }
            if (output.type === 'send-max-noaddress') {
                return {
                    script,
                };
            }
            throw new Error('WRONG-OUTPUT-TYPE');
        })
        .map(output => Object.assign(output, { weight: outputWeight(output) }));
}

export function convertFeeRate(rate: string | number) {
    const feeRate = typeof rate === 'string' ? Number(rate) : rate;
    if (
        Number.isNaN(feeRate) ||
        !Number.isFinite(feeRate) ||
        feeRate > Number.MAX_SAFE_INTEGER ||
        feeRate <= 0
    ) {
        return;
    }
    return feeRate;
}
