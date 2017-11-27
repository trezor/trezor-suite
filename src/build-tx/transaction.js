/* @flow */

import {Permutation} from './permutation';
import {
    address as BitcoinJsAddress,
    script as BitcoinJsScript,
} from 'bitcoinjs-lib-zcash';

import type {
    Network as BitcoinJsNetwork,
} from 'bitcoinjs-lib-zcash';

import type {UtxoInfo} from '../discovery';
import * as coinselect from './coinselect';
import * as request from './request';

function inputComparator(aHash: Buffer, aVout: number, bHash: Buffer, bVout: number) {
    return reverseBuffer(aHash).compare(reverseBuffer(bHash)) || aVout - bVout;
}

function outputComparator(aScript: Buffer, aValue: number, bScript: Buffer, bValue: number) {
    return aValue - bValue || aScript.compare(bScript);
}

// types for building the transaction in trezor.js
export type Output = {
    path: Array<number>,
    value: number,
    segwit: boolean,
} | {
    address: string,
    value: number,
} | {
    opReturnData: Buffer,
};

export type Input = {
    hash: Buffer,
    index: number,
    path?: Array<number>, // necessary for trezor.js
    segwit: boolean,
    amount?: number, // only with segwit
};

export type Transaction = {
    inputs: Array<Input>,
		outputs: Permutation<Output>, // not in trezor.js, but needed for metadata saving
};

export function createTransaction(
    allInputs: Array<UtxoInfo>,
    selectedInputs: Array<coinselect.Input>,
    allOutputs: Array<request.OutputRequestWithAddress>,
    selectedOutputs: Array<coinselect.OutputOut>,
    segwit: boolean,
    inputAmounts: boolean,
    basePath: Array<number>,
    changeId: number,
    changeAddress: string,
    network: BitcoinJsNetwork
): Transaction {
    const convertedInputs = selectedInputs.map(input => {
        const id = input.id;
        const richInput = allInputs[id];
        return convertInput(
            richInput,
            segwit,
            inputAmounts,
            basePath
        );
    });
    const convertedOutputs = selectedOutputs.map((output, i) => {
        // change is always last
        const isChange = i === allOutputs.length;

        const original: request.OutputRequestWithAddress = allOutputs[i]; // null if change

        if ((!isChange) && original.type === 'opreturn') {
            const opReturnData: string = original.dataHex;
            return convertOpReturnOutput(opReturnData);
        } else {
            // TODO refactor and get rid of FlowIssues everywhere
            // $FlowIssue
            const address = isChange ? changeAddress : original.address;
            const amount = output.value;
            return convertOutput(
                address,
                amount,
                network,
                basePath,
                changeId,
                isChange,
                segwit
            );
        }
    });
    convertedInputs.sort((a, b) => {
        return inputComparator(a.hash, a.index, b.hash, b.index);
    });
    const permutedOutputs = Permutation.fromFunction(convertedOutputs, (a, b) => {
        // $FlowIssue
        const aValue: number = a.output.value != null ? a.output.value : 0;
        // $FlowIssue
        const bValue: number = b.output.value != null ? b.output.value : 0;
        return outputComparator(a.script, aValue, b.script, bValue);
    }).map(o => o.output);
    return {
        inputs: convertedInputs,
        outputs: permutedOutputs,
    };
}

function convertInput(
    utxo: UtxoInfo,
    segwit: boolean,
    inputAmounts: boolean,
    basePath: Array<number>
): Input {
    const res = {
        hash: reverseBuffer(new Buffer(utxo.transactionHash, 'hex')),
        index: utxo.index,
        path: basePath.concat([...utxo.addressPath]),
        segwit: segwit,
    };
    if (inputAmounts) {
        return {
            ...res,
            amount: utxo.value,
        };
    }
    return res;
}

function convertOpReturnOutput(
    opReturnData: string
): {
    output: Output,
    script: Buffer,
} {
    const opReturnDataBuffer = new Buffer(opReturnData, 'hex');
    const output = {
        opReturnData: opReturnDataBuffer,
    };
    // $FlowIssue
    const script = BitcoinJsScript.nullData.output.encode(opReturnDataBuffer);
    return {
        output,
        script,
    };
}

function convertOutput(
    address: string,
    value: number,
    network: BitcoinJsNetwork,
    basePath: Array<number>,
    changeId: number,
    isChange: boolean,
    segwit: boolean,
): {
    output: Output,
    script: Buffer,
} {
    const output: Output = isChange ? {
        path: [...basePath, 1, changeId],
        segwit,
        value,
    } : {
        address: address,
        value,
    };

    return {
        output,
        script: BitcoinJsAddress.toOutputScript(address, network),
    };
}

function reverseBuffer(src: Buffer): Buffer {
    const buffer = new Buffer(src.length);
    for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
        buffer[i] = src[j];
        buffer[j] = src[i];
    }
    return buffer;
}
