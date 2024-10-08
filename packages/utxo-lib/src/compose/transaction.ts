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

    return {
        inputs: convertedInputs,
        outputs: convertedOutputs,
        outputsPermutation: defaultPermutation,
    };
}
