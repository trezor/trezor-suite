import * as BitcoinJsAddress from '../address';
import type { CoinSelectInput, CoinSelectOutput } from '../coinselect';
import type { ComposeInput, ComposeOutput } from './request';
import type { Network } from '../networks';

const SEGWIT_INPUT_SCRIPT_LENGTH = 51; // actually 50.25, but let's make extra room
const INPUT_SCRIPT_LENGTH = 109;
const P2PKH_OUTPUT_SCRIPT_LENGTH = 25;
const P2SH_OUTPUT_SCRIPT_LENGTH = 23;
const P2WPKH_OUTPUT_SCRIPT_LENGTH = 22;
const P2WSH_OUTPUT_SCRIPT_LENGTH = 34;

export function convertInputs(
    inputs: ComposeInput[],
    height: number,
    segwit: boolean,
): CoinSelectInput[] {
    const bytesPerInput = segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH;
    return inputs.map((input, i) => ({
        i,
        script: { length: bytesPerInput },
        value: input.value,
        own: input.own,
        coinbase: input.coinbase,
        confirmations: input.height == null ? 0 : 1 + height - input.height,
        required: input.required,
    }));
}

export function isBech32(address: string) {
    try {
        BitcoinJsAddress.fromBech32(address);
        return true;
    } catch (e) {
        return false;
    }
}

export function getScriptAddress(address: string, network: Network) {
    const bech = isBech32(address);
    let pubkeyhash;
    if (!bech) {
        const decoded = BitcoinJsAddress.fromBase58Check(address, network);
        pubkeyhash = decoded.version === network.pubKeyHash;
    } else {
        const decoded = BitcoinJsAddress.fromBech32(address);
        pubkeyhash = decoded.data.length === 20;
    }

    const becLength = pubkeyhash ? P2WPKH_OUTPUT_SCRIPT_LENGTH : P2WSH_OUTPUT_SCRIPT_LENGTH;
    const norLength = pubkeyhash ? P2PKH_OUTPUT_SCRIPT_LENGTH : P2SH_OUTPUT_SCRIPT_LENGTH;
    const length = bech ? becLength : norLength;
    return { length };
}

export function convertOutputs(outputs: ComposeOutput[], network: Network): CoinSelectOutput[] {
    // most scripts are P2PKH; default is P2PKH
    const defaultScript = { length: P2PKH_OUTPUT_SCRIPT_LENGTH };
    return outputs.map(output => {
        if (output.type === 'complete') {
            return {
                value: output.amount,
                script: getScriptAddress(output.address, network),
            };
        }
        if (output.type === 'noaddress') {
            return {
                value: output.amount,
                script: defaultScript,
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
                script: getScriptAddress(output.address, network),
            };
        }
        if (output.type === 'send-max-noaddress') {
            return {
                script: defaultScript,
            };
        }
        throw new Error('WRONG-OUTPUT-TYPE');
    });
}
