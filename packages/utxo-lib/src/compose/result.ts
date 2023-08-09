import { createTransaction } from './transaction';
import {
    CoinSelectSuccess,
    ComposedTransaction,
    ComposeRequest,
    ComposeInput,
    ComposeOutput,
    ComposeFinalOutput,
    ComposeNotFinalOutput,
    ComposeResultError,
    ComposeResultNonFinal,
    ComposeResultFinal,
    COMPOSE_ERROR_TYPES,
} from '../types';

export function getErrorResult(error: unknown): ComposeResultError {
    const message = error instanceof Error ? error.message : `${error}`;
    const known = COMPOSE_ERROR_TYPES.find(e => e === message);
    if (known) {
        return { type: 'error', error: known };
    }
    return { type: 'error', error: 'COINSELECT', message };
}

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

function getFinalResult<Input extends ComposeInput, Output extends ComposeOutput>(
    result: CoinSelectSuccess,
    transaction: ComposedTransaction<Input, Output>,
): ComposeResultFinal<Input, Output> {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    return {
        type: 'final',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        transaction,
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

export function getResult<Input extends ComposeInput, Output extends ComposeOutput>(
    request: ComposeRequest<Input, Output>,
    result: CoinSelectSuccess,
) {
    const splitOutputs = splitByCompleteness(request.outputs);

    if (splitOutputs.incomplete.length > 0) {
        return getNonfinalResult(result);
    }

    const transaction = createTransaction(
        request.utxos,
        result.payload.inputs,
        splitOutputs.complete,
        result.payload.outputs,
        request.basePath,
        request.changeId,
        request.skipPermutation,
    );

    return getFinalResult(result, transaction) as ComposeResultFinal<Input, Output>;
}
