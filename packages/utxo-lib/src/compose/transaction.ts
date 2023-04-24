import * as BN from 'bn.js';
import type {
    ComposeInput,
    ComposeChangeAddress,
    ComposeOutputAddress,
    ComposeOutputChange,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectInput,
    CoinSelectOutputFinal,
} from '../types';

function convertOutput(
    output: CoinSelectOutputFinal,
    original: ComposeFinalOutput | undefined,
    changeAddress: ComposeChangeAddress,
) {
    if (!original) {
        return {
            type: 'change',
            amount: output.value,
            ...changeAddress,
        } as ComposeOutputChange;
    }

    if (original.type === 'opreturn') {
        return original;
    }

    return {
        ...original,
        type: 'payment',
        amount: output.value,
    } as ComposeOutputAddress;
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

export function createTransaction<
    Input extends ComposeInput,
    ChangeAddress extends ComposeChangeAddress,
>(
    allInputs: Input[],
    selectedInputs: CoinSelectInput[],
    allOutputs: ComposeFinalOutput[],
    selectedOutputs: CoinSelectOutputFinal[],
    changeAddress: ChangeAddress,
    skipPermutation?: boolean,
): ComposedTransaction<Input, ComposeFinalOutput, ChangeAddress> {
    const convertedInputs = selectedInputs.map(input => allInputs[input.i]);
    const convertedOutputs = selectedOutputs.map((output, i) =>
        convertOutput(output, allOutputs[i], changeAddress),
    );
    const permutation = convertedOutputs.map((_o, i) => i);

    if (skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: {
                sorted: convertedOutputs,
                permutation,
            },
        };
    }

    const sortedPermutation = permutation.sort((a, b) =>
        outputComparator(selectedOutputs[a], selectedOutputs[b]),
    );
    const sortedOutputs = sortedPermutation.map(index => convertedOutputs[index]);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: {
            sorted: sortedOutputs,
            permutation: sortedPermutation,
        },
    };
}
