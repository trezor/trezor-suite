import BN from 'bn.js';

import { createTransaction } from './transaction';
import { transactionBytes } from '../coinselect/coinselectUtils';
import {
    COMPOSE_ERROR_TYPES,
    type CoinSelectRequest,
    type CoinSelectResult,
    type ComposeChangeAddress,
    type ComposeFinalOutput,
    type ComposeInput,
    type ComposeNotFinalOutput,
    type ComposeOutput,
    type ComposeRequest,
    type ComposeResult,
    type ComposeResultError,
    type ComposeResultFinal,
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

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const sendMaxOutput: (typeof result.outputs)[number] = result.outputs[sendMaxOutputIndex];
    const max = sendMaxOutputIndex >= 0 ? sendMaxOutput.value.toString() : undefined;
    const bytes = transactionBytes(result.inputs, result.outputs);
    const feePerByte = result.fee / bytes;

    const { complete, incomplete } = splitByCompleteness(request.outputs);

    if (incomplete.length > 0) {
        const inputs = result.inputs.map(input => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const utxo: Input = request.utxos[input.i];

            return utxo;
        });

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
