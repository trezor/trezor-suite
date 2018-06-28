/* @flow */

// this is converting in/to coinselect format
//
// I am using the coinselect format, since the end-goal is
// to merge the changes back to upstream; it didn't work out so far
import bitcoinJsSplit from './coinselect-lib/outputs/split';
import bitcoinJsCoinselect from './coinselect-lib';
import {transactionBytes} from './coinselect-lib/utils';

import type {
    Network as BitcoinJsNetwork,
} from 'bitcoinjs-lib-zcash';
import {
    address as BitcoinJsAddress,
} from 'bitcoinjs-lib-zcash';

import type {UtxoInfo} from '../discovery';
import * as request from './request';
import {convertCashAddress} from '../utils/bchaddr';

const SEGWIT_INPUT_SCRIPT_LENGTH = 51; // actually 50.25, but let's make extra room
const INPUT_SCRIPT_LENGTH = 109;
const P2PKH_OUTPUT_SCRIPT_LENGTH = 25;
const P2SH_OUTPUT_SCRIPT_LENGTH = 23;
const P2WPKH_OUTPUT_SCRIPT_LENGTH = 22;
const P2WSH_OUTPUT_SCRIPT_LENGTH = 34;

export type Input = {
    id: number,
    script: {
        length: number,
    },
    value: number,

    own: boolean,
    coinbase: boolean,
    confirmations: number,
}

type OutputIn = {
    value?: number,
    script: {
        length: number,
    },
}

export type OutputOut = {
    value: number,
    script?: {
        length: number,
    },
}

export type CompleteResult = {
    type: 'true',
    result: {
        inputs: Array<Input>,
        outputs: Array<OutputOut>,
        fee: number,
        feePerByte: number,
        bytes: number,
        totalSpent: number,
        max: number,
    },
}

export type Result = CompleteResult | {
    type: 'false',
}

export function coinselect(
    utxos: Array<UtxoInfo>,
    rOutputs: Array<request.OutputRequest>,
    height: number,
    feeRate: number,
    segwit: boolean,
    countMax: boolean,
    countMaxId: number,
    dustThreshold: number,
    network: BitcoinJsNetwork
): Result {
    const inputs = convertInputs(utxos, height, segwit);
    const outputs = convertOutputs(rOutputs, network);
    const options = {
        inputLength: segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH,
        changeOutputLength: segwit ? P2SH_OUTPUT_SCRIPT_LENGTH : P2PKH_OUTPUT_SCRIPT_LENGTH,
        dustThreshold,
    };

    const algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    const result = algorithm(inputs, outputs, feeRate, options);
    if (!result.inputs) {
        return {
            type: 'false',
        };
    } else {
        const fee = result.fee;
        const max = countMaxId === -1 ? -1 : result.outputs[countMaxId].value;

        const totalSpent = result.outputs.filter((output, i) => {
            // change is always last and additional one
            return i !== rOutputs.length;
        }).map(o => o.value).reduce((a, b) => a + b, 0) + result.fee;

        const allSize = transactionBytes(result.inputs, result.outputs);
        const feePerByte = fee / allSize;
        return {
            type: 'true',
            result: {
                ...result,
                feePerByte,
                bytes: allSize,
                max,
                totalSpent,
            },
        };
    }
}

function convertInputs(
    inputs: Array<UtxoInfo>,
    height: number,
    segwit: boolean
): Array<Input> {
    const bytesPerInput = segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH;
    return inputs.map((input, i) => ({
        id: i,
        script: {length: bytesPerInput},
        value: input.value,
        own: input.own,
        coinbase: input.coinbase,
        confirmations: input.height == null
            ? 0
            : (1 + height - input.height),
    }));
}

function isBech32(address: string): boolean {
    try {
        BitcoinJsAddress.fromBech32(address);
        return true;
    } catch (e) {
        return false;
    }
}

function getScriptAddress(address: string, network: BitcoinJsNetwork): {length: number} {
    const bech = isBech32(address);
    let pubkeyhash;
    if (!bech) {
        const decoded = BitcoinJsAddress.fromBase58Check(convertCashAddress(address));
        pubkeyhash = decoded.version === network.pubKeyHash;
    } else {
        const decoded = BitcoinJsAddress.fromBech32(address);
        pubkeyhash = decoded.data.length === 20;
    }

    const length = bech
        ? (pubkeyhash ? P2WPKH_OUTPUT_SCRIPT_LENGTH : P2WSH_OUTPUT_SCRIPT_LENGTH)
        : (pubkeyhash ? P2PKH_OUTPUT_SCRIPT_LENGTH : P2SH_OUTPUT_SCRIPT_LENGTH);
    return {length};
}

function convertOutputs(
    outputs: Array<request.OutputRequest>,
    network: BitcoinJsNetwork
): Array<OutputIn> {
    // most scripts are P2PKH; default is P2PKH
    const defaultScript = {length: P2PKH_OUTPUT_SCRIPT_LENGTH};
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
                value: 0,
                script: {length: 2 + (output.dataHex.length / 2)},
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

