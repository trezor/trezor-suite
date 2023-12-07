import {
    ComposeRequest,
    CoinSelectSuccess,
    ComposeInput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectOutputFinal,
} from '../types';

function convertOutput(
    selectedOutput: CoinSelectOutputFinal,
    composeOutput: ComposeFinalOutput | ({ type: 'change' } & ComposeChangeAddress),
) {
    if (composeOutput.type === 'change') {
        return {
            ...composeOutput,
            amount: selectedOutput.value.toString(),
        };
    }

    if (composeOutput.type === 'opreturn') {
        return composeOutput;
    }

    return {
        ...composeOutput,
        type: 'payment' as const,
        amount: selectedOutput.value.toString(),
    };
}

function inputComparator(a: ComposeInput, b: ComposeInput) {
    return Buffer.from(a.txid, 'hex').compare(Buffer.from(b.txid, 'hex')) || a.vout - b.vout;
}

function outputComparator(a: CoinSelectOutputFinal, b: CoinSelectOutputFinal) {
    return (
        a.value.cmp(b.value) ||
        (Buffer.isBuffer(a.script) && Buffer.isBuffer(b.script)
            ? a.script.compare(b.script)
            : a.script.length - b.script.length)
    );
}

export function createTransaction<Input extends ComposeInput, Change extends ComposeChangeAddress>(
    request: ComposeRequest<Input, ComposeFinalOutput, Change>,
    result: CoinSelectSuccess,
): ComposedTransaction<Input, ComposeFinalOutput, Change> {
    const convertedInputs = result.inputs.map(input => request.utxos[input.i]);

    const defaultPermutation: number[] = [];
    const convertedOutputs = result.outputs.map((output, index) => {
        defaultPermutation.push(index);
        if (request.outputs[index]) {
            return convertOutput(output, request.outputs[index]);
        }
        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    if (request.skipPermutation) {
        return {
            inputs: convertedInputs,
            outputs: convertedOutputs,
            outputsPermutation: defaultPermutation,
        };
    }

    const permutation = defaultPermutation.sort((a, b) =>
        outputComparator(result.outputs[a], result.outputs[b]),
    );
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        inputs: convertedInputs.sort(inputComparator),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
}
