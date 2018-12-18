/* @flow */

import * as request from './request';
import * as result from './result';
import * as transaction from './transaction';
import * as coinselect from './coinselect';

export { empty as BuildTxEmptyResult } from './result';
export { Request as BuildTxRequest, OutputRequest as BuildTxOutputRequest } from './request';
export { Result as BuildTxResult } from './result';
export { Transaction as BuildTxTransaction, Output as BuildTxOutput, Input as BuildTxInput } from './transaction';

export function buildTx(
    {
        utxos,
        outputs,
        height,
        feeRate,
        segwit,
        inputAmounts,
        basePath,
        network,
        changeId,
        changeAddress,
        dustThreshold,
    }: request.Request,
): result.Result {
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
        return { type: 'error', error: e.message };
    }
    const splitOutputs = request.splitByCompleteness(outputs);

    let csResult: coinselect.Result = { type: 'false' };
    try {
        csResult = coinselect.coinselect(
            utxos,
            outputs,
            height,
            feeRate,
            segwit,
            countMax.exists,
            countMax.id,
            dustThreshold,
            network,
        );
    } catch (e) {
        return { type: 'error', error: e.message };
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
        segwit,
        inputAmounts,
        basePath,
        changeId,
        changeAddress,
        network,
    );
    return result.getFinalResult(csResult, resTransaction);
}
