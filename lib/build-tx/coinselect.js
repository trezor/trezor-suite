/* @flow */

// this is converting in/to coinselect format
//
// I am using the coinselect format, since the end-goal is
// to merge the changes back to upstream; it didn't work out so far
import bitcoinJsSplit from './coinselect-lib/outputs/split';
import bitcoinJsCoinselect from './coinselect-lib';
import {transactionBytes} from './coinselect-lib/utils';

import type {UtxoInfo} from '../discovery';
import * as request from './request';

const SEGWIT_INPUT_SCRIPT_LENGTH = 50;
const INPUT_SCRIPT_LENGTH = 108;
const OUTPUT_SCRIPT_LENGTH = 25;

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
    dustThreshold: number
): Result {
    const inputs = convertInputs(utxos, height, segwit);
    const outputs = convertOutputs(rOutputs);
    const options = {
        inputLength: segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH,
        outputLength: OUTPUT_SCRIPT_LENGTH,
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

function convertOutputs(
    outputs: Array<request.OutputRequest>
): Array<OutputIn> {
    const script = {length: OUTPUT_SCRIPT_LENGTH};
    return outputs.map(output => {
        if (output.type === 'complete' || output.type === 'noaddress') {
            return {
                value: output.amount,
                script,
            };
        }
        if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
            return {
                script,
            };
        }
        throw new Error('WRONG-OUTPUT-TYPE');
    });
}

