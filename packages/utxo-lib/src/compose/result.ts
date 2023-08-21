import { createTransaction } from './transaction';
import {
    CoinSelectSuccess,
    ComposedTransaction,
    ComposeRequest,
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
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

function getNonfinalResult<Input extends ComposeInput>(
    utxos: Input[],
    result: CoinSelectSuccess,
): ComposeResultNonFinal<Input> {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;
    const inputs = result.payload.inputs.map(input => utxos[input.i]);
    return {
        type: 'nonfinal',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent,
        inputs,
    };
}

function getFinalResult<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    Change extends ComposeChangeAddress,
>(
    result: CoinSelectSuccess,
    transaction: ComposedTransaction<Input, Output, Change>,
): ComposeResultFinal<Input, Output, Change> {
    const { max, fee, feePerByte, bytes, totalSpent } = result.payload;

    return {
        type: 'final',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent,
        ...transaction,
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
    Change extends ComposeChangeAddress,
>(request: ComposeRequest<Input, Output, Change>, result: CoinSelectSuccess) {
    const splitOutputs = splitByCompleteness(request.outputs);

    if (splitOutputs.incomplete.length > 0) {
        return getNonfinalResult(request.utxos, result);
    }

    const transaction = createTransaction(
        request.utxos,
        result.payload.inputs,
        splitOutputs.complete,
        result.payload.outputs,
        request.changeAddress,
        request.skipPermutation,
    );

    return getFinalResult(result, transaction) as ComposeResultFinal<Input, Output, Change>;
}
