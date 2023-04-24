import { createTransaction } from './transaction';
import type {
    CoinSelectSuccess,
    ComposeInput,
    ComposeOutput,
    ComposeFinalOutput,
    ComposeNotFinalOutput,
    ComposeRequest,
    ComposeChangeAddress,
    ComposeResultNonFinal,
    ComposeResultFinal,
} from '../types';

function getNonfinalResult(result: CoinSelectSuccess): ComposeResultNonFinal {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    return {
        type: 'nonfinal',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent,
    };
}

function splitByCompleteness(outputs: ComposeOutput[]) {
    const complete: ComposeFinalOutput[] = [];
    const incomplete: ComposeNotFinalOutput[] = [];

    outputs.forEach(output => {
        if (output.type === 'payment' || output.type === 'send-max' || output.type === 'opreturn') {
            complete.push(output);
        } else {
            incomplete.push(output);
        }
    });

    return {
        complete,
        incomplete,
    };
}

export function getResult<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
>(request: ComposeRequest<Input, Output, ChangeAddress>, result: CoinSelectSuccess) {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    const splitOutputs = splitByCompleteness(request.outputs);

    if (splitOutputs.incomplete.length > 0) {
        return getNonfinalResult(result);
    }

    const transaction = createTransaction(
        request.utxos,
        result.payload.inputs,
        splitOutputs.complete,
        result.payload.outputs,
        request.changeAddress,
        request.skipPermutation,
    );

    return {
        type: 'final',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        transaction,
        max,
        totalSpent,
    } as ComposeResultFinal<Input, Output, ChangeAddress>;
}
