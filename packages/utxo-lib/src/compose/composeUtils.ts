import * as BitcoinJsAddress from '../address';
import { p2data } from '../payments/embed';
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
            value: input.amount,
            own: input.own,
            coinbase: input.coinbase,
            confirmations: input.confirmations,
            required: input.required,
        }))
        .map(input => Object.assign(input, { weight: inputWeight(input) }));
}

export function convertOutputs(
    outputs: ComposeOutput[],
    network: Network,
    txType: CoinSelectPaymentType,
): CoinSelectOutput[] {
    const script = { length: OUTPUT_SCRIPT_LENGTH[txType] };
    return outputs
        .map(output => {
            if (output.type === 'payment') {
                return {
                    value: output.amount,
                    script: BitcoinJsAddress.toOutputScript(output.address, network),
                };
            }
            if (output.type === 'payment-noaddress') {
                return {
                    value: output.amount,
                    script,
                };
            }
            if (output.type === 'opreturn') {
                return {
                    value: '0',
                    script: p2data({ data: [Buffer.from(output.dataHex, 'hex')] }).output as Buffer,
                };
            }
            if (output.type === 'send-max') {
                return {
                    script: BitcoinJsAddress.toOutputScript(output.address, network),
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
