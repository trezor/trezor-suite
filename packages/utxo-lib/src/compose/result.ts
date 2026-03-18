import BN from 'bn.js';

import { restorePsbtComposeResult } from './psbtCompose';
import { type ValidatedComposeRequest } from './request';
import { createTransaction } from './transaction';
import { transactionBytes } from '../coinselect/coinselectUtils';
import {
    COMPOSE_ERROR_TYPES,
    type CoinSelectResult,
    type ComposeChangeAddress,
    type ComposeFinalOutput,
    type ComposeInput,
    type ComposeNotFinalOutput,
    type ComposeOutput,
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
    request: ValidatedComposeRequest<Input, Change>,
    result: CoinSelectResult,
): ComposeResult<Input, Output, Change> {
    const { composeRequest, psbtComposeContext, sendMaxOutputIndex } = request;

    if (!result.inputs || !result.outputs) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    const totalSpent = result.outputs.reduce((total, output, index) => {
        if (composeRequest.outputs[index]) {
            return total.add(output.value);
        }

        return total;
    }, new BN(result.fee));

    const max =
        sendMaxOutputIndex >= 0 ? result.outputs[sendMaxOutputIndex].value.toString() : undefined;
    const bytes = transactionBytes(result.inputs, result.outputs);
    const feePerByte = result.fee / bytes;

    const { complete, incomplete } = splitByCompleteness(composeRequest.outputs);

    if (incomplete.length > 0) {
        const inputs = result.inputs.map(input => composeRequest.utxos[input.i]);

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

    const transaction = createTransaction({ ...composeRequest, outputs: complete }, result);

    const composeResult = {
        type: 'final',
        fee: result.fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent: totalSpent.toString(),
        ...transaction,
    } as ComposeResultFinal<Input, Output, Change>;

    return restorePsbtComposeResult(composeRequest as any, composeResult, psbtComposeContext);
}
