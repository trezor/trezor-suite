import * as BN from 'bn.js';
import {
    ComposeInput,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectInput,
    CoinSelectOutputFinal,
} from '../types';

function convertOutput(
    selectedOutput: CoinSelectOutputFinal,
    composeOutput: ComposeFinalOutput | { path: number[] },
) {
    if ('path' in composeOutput) {
        return {
            type: 'change' as const,
            path: composeOutput.path,
            amount: selectedOutput.value,
        };
    }

    if (composeOutput.type === 'opreturn') {
        return composeOutput;
    }

    return {
        ...composeOutput,
        type: 'payment' as const,
        amount: selectedOutput.value,
    };
}

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(a: CoinSelectOutputFinal, b: CoinSelectOutputFinal) {
    return (
        new BN(a.value).cmp(new BN(b.value)) ||
        (Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)
            ? a.script.compare(b.script)
            : a.script.length - b.script.length)
    );
}

export function createTransaction<Input extends ComposeInput>(
    allInputs: Input[],
    selectedInputs: CoinSelectInput[],
    allOutputs: ComposeFinalOutput[],
    selectedOutputs: CoinSelectOutputFinal[],
    basePath: number[],
    changeId: number,
    skipPermutation?: boolean,
): ComposedTransaction<Input, ComposeFinalOutput> {
    const convertedInputs = selectedInputs.map(input => allInputs[input.i]);
    const convertedOutputs = selectedOutputs.map((output, index) =>
        convertOutput(output, allOutputs[index] || { path: [...basePath, 1, changeId] }),
    );
    const defaultPermutation = convertedOutputs.map((_, index) => index);

    if (skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: {
                sorted: convertedOutputs,
                permutation: defaultPermutation,
            },
        };
    }

    const permutation = defaultPermutation.sort((a, b) =>
        outputComparator(selectedOutputs[a], selectedOutputs[b]),
    );
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: {
            sorted: sortedOutputs,
            permutation,
        },
    };
}
