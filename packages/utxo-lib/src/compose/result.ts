import BN from 'bn.js';

import { transactionBytes } from '../coinselect/coinselectUtils';
import { createTransaction } from './transaction';
import {
    CoinSelectRequest,
    CoinSelectResult,
    ComposeRequest,
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
    ComposeFinalOutput,
    ComposeNotFinalOutput,
    ComposeResult,
    ComposeResultFinal,
    ComposeResultError,
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
>(
    request: ComposeRequest<Input, Output, Change>,
    { sendMaxOutputIndex }: CoinSelectRequest,
    result: CoinSelectResult,
): ComposeResult<Input, Output, Change> {
    if (!result.inputs || !result.outputs) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    const totalSpent = result.outputs.reduce((total, output, index) => {
        if (request.outputs[index]) {
            return total.add(output.value);
        }
        return total;
    }, new BN(result.fee));

    const max =
        sendMaxOutputIndex >= 0 ? result.outputs[sendMaxOutputIndex].value.toString() : undefined;
    const bytes = transactionBytes(result.inputs, result.outputs);
    const feePerByte = result.fee / bytes;

    const { complete, incomplete } = splitByCompleteness(request.outputs);

    if (incomplete.length > 0) {
        const inputs = result.inputs.map(input => request.utxos[input.i]);
        return {
            type: 'nonfinal',
            fee: result.fee.toString(),
            feePerByte: feePerByte.toString(),
            bytes,
            max,
            totalSpent: totalSpent.toString(),
            inputs,
        };
    }

    const transaction = createTransaction({ ...request, outputs: complete }, result);

    return {
        type: 'final',
        fee: result.fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent: totalSpent.toString(),
        ...transaction,
    } as ComposeResultFinal<Input, Output, Change>;
}
