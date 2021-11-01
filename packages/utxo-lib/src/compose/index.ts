import * as request from './request';
import * as result from './result';
import * as transaction from './transaction';
import { coinselect } from './coinselect';

import type { Result } from './coinselect';

export function composeTx({
    txType,
    utxos,
    outputs,
    height,
    feeRate,
    basePath,
    network,
    changeId,
    changeAddress,
    dustThreshold,
    baseFee,
    floorBaseFee,
    dustOutputFee,
    skipUtxoSelection,
    skipPermutation,
}: request.ComposeRequest): result.ComposeResult {
    if (outputs.length === 0) {
        return result.empty;
    }
    if (utxos.length === 0) {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }

    let countMax = { exists: false, id: 0 };
    try {
        countMax = request.getMax(outputs);
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }
        return { type: 'error', error: `${e}` };
    }
    const splitOutputs = request.splitByCompleteness(outputs);

    let csResult: Result = { type: 'false' };
    try {
        csResult = coinselect(
            txType || 'p2pkh',
            utxos,
            outputs,
            height,
            parseInt(feeRate, 10),
            countMax.exists,
            countMax.id,
            dustThreshold,
            network,
            baseFee,
            floorBaseFee,
            dustOutputFee,
            skipUtxoSelection,
            skipPermutation,
        );
    } catch (e) {
        if (e instanceof Error) {
            return { type: 'error', error: e.message };
        }
        return { type: 'error', error: `${e}` };
    }

    if (csResult.type === 'false') {
        return { type: 'error', error: 'NOT-ENOUGH-FUNDS' };
    }
    if (splitOutputs.incomplete.length > 0) {
        return result.getNonfinalResult(csResult);
    }

    const resTransaction = transaction.createTransaction(
        utxos,
        csResult.result.inputs,
        splitOutputs.complete,
        csResult.result.outputs,
        basePath,
        changeId,
        changeAddress,
        network,
        skipPermutation,
    );
    return result.getFinalResult(csResult, resTransaction);
}
