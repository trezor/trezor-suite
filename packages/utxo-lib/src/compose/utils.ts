import * as BitcoinJsAddress from '../address';
import type { CoinSelectInput, CoinSelectOutput } from '../coinselect';
import type { ComposeInput, ComposeOutput } from './request';
import type { Network } from '../networks';

// https://bitcoinops.org/en/tools/calc-size/

export const INPUT_SCRIPT_LENGTH = {
    p2pkh: 109,
    p2sh: 51, // 50.25
    p2tr: 17, // 57.5 - 41 (coinselect/utils/TX_INPUT_BASE),
    p2wpkh: 28,
} as const;

export const OUTPUT_SCRIPT_LENGTH = {
    p2pkh: 25,
    p2sh: 23,
    p2tr: 34,
    p2wpkh: 22,
    p2wsh: 34,
} as const;

export type TxType = keyof typeof INPUT_SCRIPT_LENGTH;

export function convertInputs(
    inputs: ComposeInput[],
    height = 0,
    txType: TxType = 'p2pkh',
): CoinSelectInput[] {
    return inputs.map((input, i) => ({
        i,
        script: { length: INPUT_SCRIPT_LENGTH[txType] },
        value: input.value,
        own: input.own,
        coinbase: input.coinbase,
        confirmations: input.height == null ? 0 : 1 + height - input.height,
        required: input.required,
    }));
}

export function getScriptFromAddress(address: string, network: Network) {
    return {
        length: BitcoinJsAddress.toOutputScript(address, network).length,
    };
}

export function convertOutputs(
    outputs: ComposeOutput[],
    network: Network,
    txType: TxType = 'p2pkh',
): CoinSelectOutput[] {
    const script = { length: OUTPUT_SCRIPT_LENGTH[txType] };
    return outputs.map(output => {
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
    });
}
