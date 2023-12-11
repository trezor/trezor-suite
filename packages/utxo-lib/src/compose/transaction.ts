import BN from 'bn.js';
import {
    ComposeInput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectInput,
    CoinSelectOutputFinal,
} from '../types';

function convertOutput(
    selectedOutput: CoinSelectOutputFinal,
    composeOutput: ComposeFinalOutput | ({ type: 'change' } & ComposeChangeAddress),
) {
    if (composeOutput.type === 'change') {
        return {
            ...composeOutput,
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

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    allInputs: Input[],
    selectedInputs: CoinSelectInput[],
    allOutputs: ComposeFinalOutput[],
    selectedOutputs: CoinSelectOutputFinal[],
    changeAddress: Change,
    skipPermutation?: boolean,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const convertedInputs = selectedInputs.map(input => allInputs[input.i]);
    const convertedOutputs = selectedOutputs.map((output, index) =>
        convertOutput(output, allOutputs[index] || { type: 'change', ...changeAddress }),
    );
    const defaultPermutation = convertedOutputs.map((_, index) => index);

    if (skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: convertedOutputs,
            outputsPermutation: defaultPermutation,
        };
    }

    const permutation = defaultPermutation.sort((a, b) =>
        outputComparator(selectedOutputs[a], selectedOutputs[b]),
    );
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
}
