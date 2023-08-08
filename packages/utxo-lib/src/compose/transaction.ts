import * as BN from 'bn.js';
import * as BitcoinJsAddress from '../address';
import { p2data } from '../payments/embed';
import {
    ComposeInput,
    ComposeFinalOutput,
    ComposedTxOutput,
    ComposedTransaction,
    CoinSelectInput,
    CoinSelectOutputFinal,
} from '../types';
import type { Network } from '../networks';

function convertOpReturnOutput(opReturnData: string) {
    const opReturnDataBuffer = Buffer.from(opReturnData, 'hex');
    const output = {
        dataHex: opReturnData,
        amount: undefined,
    };
    const script = p2data({ data: [opReturnDataBuffer] }).output as Buffer;
    return {
        output,
        script,
    };
}

function convertOutput(
    address: string,
    amount: string,
    network: Network,
    basePath: number[],
    changeId: number,
    isChange: boolean,
) {
    const output: ComposedTxOutput = isChange
        ? {
              path: [...basePath, 1, changeId],
              amount,
          }
        : {
              address,
              amount,
          };

    return {
        output,
        script: BitcoinJsAddress.toOutputScript(address, network),
    };
}

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(aScript: Buffer, aValue: string, bScript: Buffer, bValue: string) {
    return new BN(aValue).cmp(new BN(bValue)) || aScript.compare(bScript);
}

export function createTransaction<Input extends ComposeInput>(
    allInputs: Input[],
    selectedInputs: CoinSelectInput[],
    allOutputs: ComposeFinalOutput[],
    selectedOutputs: CoinSelectOutputFinal[],
    basePath: number[],
    changeId: number,
    changeAddress: string,
    network: Network,
    skipPermutation?: boolean,
): ComposedTransaction<Input> {
    const convertedInputs = selectedInputs.map(input => allInputs[input.i]);
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
    const defaultPermutation = convertedOutputs.map((_, index) => index);

    if (skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: {
                sorted: convertedOutputs.map(({ output }) => output),
                permutation: defaultPermutation,
            },
        };
    }

    const permutation = defaultPermutation.sort((a, b) =>
        outputComparator(
            convertedOutputs[a].script,
            convertedOutputs[a].output.amount || '0',
            convertedOutputs[b].script,
            convertedOutputs[b].output.amount || '0',
        ),
    );
    const sortedOutputs = permutation.map(index => convertedOutputs[index].output);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: {
            sorted: sortedOutputs,
            permutation,
        },
    };
}
