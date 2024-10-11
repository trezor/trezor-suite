import { randomInt } from 'crypto';

import {
    ComposeRequest,
    CoinSelectSuccess,
    ComposeInput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposedTransaction,
    CoinSelectOutputFinal,
} from '../types';
import { arrayShuffle } from '@trezor/utils';

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

    const nonChangeOutputPermutation: number[] = [];
    const changeOutputPermutation: number[] = [];

    const convertedOutputs = result.outputs.map((output, index) => {
        if (request.outputs[index]) {
            nonChangeOutputPermutation.push(index);

            return convertOutput(output, request.outputs[index]);
        }

        changeOutputPermutation.push(index);

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    const permutation = [...nonChangeOutputPermutation];
    const newPositionOfChange = randomInt(0, permutation.length);
    permutation.splice(newPositionOfChange, 0, ...changeOutputPermutation);
    const sortedOutputs = permutation.map(index => convertedOutputs[index]);

    return {
        inputs: arrayShuffle(convertedInputs),
        outputs: sortedOutputs,
        outputsPermutation: permutation,
    };
}
