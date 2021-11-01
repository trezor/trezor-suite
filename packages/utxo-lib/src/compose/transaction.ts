import * as BN from 'bn.js';
import * as BitcoinJsAddress from '../address';
import { p2data } from '../payments/embed';
import { Permutation } from './permutation';
import { reverseBuffer } from '../bufferutils';
import type { ComposeInput, ComposeFinalOutput } from './request';
import type { CoinSelectInput, CoinSelectOutputFinal } from '../coinselect';
import type { Network } from '../networks';

// types for building the transaction in trezor.js
export type ComposedTxOutput =
    | {
          path: number[];
          value: string;
      }
    | {
          address: string;
          value: string;
      }
    | {
          opReturnData: Buffer;
          value?: typeof undefined;
      };

export type ComposedTxInput = {
    hash: Buffer;
    index: number;
    path: number[];
    amount: string;
};

export type ComposedTransaction = {
    inputs: ComposedTxInput[];
    outputs: Permutation<ComposedTxOutput>; // not in trezor.js, but needed for metadata saving
};

function convertInput(utxo: ComposeInput, basePath: number[]): ComposedTxInput {
    return {
        hash: reverseBuffer(Buffer.from(utxo.transactionHash, 'hex')),
        index: utxo.index,
        path: basePath.concat([...utxo.addressPath]),
        amount: utxo.value,
    };
}

function convertOpReturnOutput(opReturnData: string) {
    const opReturnDataBuffer = Buffer.from(opReturnData, 'hex');
    const output = {
        opReturnData: opReturnDataBuffer,
        value: undefined,
    };
    const script = p2data({ data: [opReturnDataBuffer] }).output as Buffer;
    return {
        output,
        script,
    };
}

function convertOutput(
    address: string,
    value: string,
    network: Network,
    basePath: number[],
    changeId: number,
    isChange: boolean,
) {
    const output: ComposedTxOutput = isChange
        ? {
              path: [...basePath, 1, changeId],
              value,
          }
        : {
              address,
              value,
          };

    return {
        output,
        script: BitcoinJsAddress.toOutputScript(address, network),
    };
}

function inputComparator(aHash: Buffer, aVout: number, bHash: Buffer, bVout: number) {
    return reverseBuffer(aHash).compare(reverseBuffer(bHash)) || aVout - bVout;
}

function outputComparator(aScript: Buffer, aValue: string, bScript: Buffer, bValue: string) {
    return new BN(aValue).sub(new BN(bValue)).toNumber() || aScript.compare(bScript);
}

export function createTransaction(
    allInputs: ComposeInput[],
    selectedInputs: CoinSelectInput[],
    allOutputs: ComposeFinalOutput[],
    selectedOutputs: CoinSelectOutputFinal[],
    basePath: number[],
    changeId: number,
    changeAddress: string,
    network: Network,
    skipPermutation?: boolean,
): ComposedTransaction {
    const convertedInputs = selectedInputs.map(input => convertInput(allInputs[input.i], basePath));
    const convertedOutputs = selectedOutputs.map((output, i) => {
        // change is always last
        const isChange = i === allOutputs.length;

        const original = allOutputs[i]; // null if change

        if (original && original.type === 'opreturn') {
            return convertOpReturnOutput(original.dataHex);
        }
        const address = !original ? changeAddress : original.address;
        const amount = output.value;
        return convertOutput(address, amount, network, basePath, changeId, isChange);
    });

    if (skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: new Permutation(
                convertedOutputs.map(o => o.output),
                convertedOutputs.map((_o, i) => i),
            ),
        };
    }

    convertedInputs.sort((a, b) => inputComparator(a.hash, a.index, b.hash, b.index));
    const permutedOutputs = Permutation.fromFunction(convertedOutputs, (a, b) => {
        const aValue = typeof a.output.value === 'string' ? a.output.value : '0';
        const bValue = typeof b.output.value === 'string' ? b.output.value : '0';
        return outputComparator(a.script, aValue, b.script, bValue);
    }).map(o => o.output);

    return {
        inputs: convertedInputs,
        outputs: permutedOutputs,
    };
}
