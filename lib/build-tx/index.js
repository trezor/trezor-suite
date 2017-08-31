/* @flow */

import type {
    Network as BitcoinJsNetwork,
} from 'bitcoinjs-lib-zcash';

import type {UtxoInfo} from '../discovery';
import * as request from './request';
import * as result from './result';
import * as trezor from './trezor';
import * as coinselect from './coinselect';

export {empty as emptyBuildTxResult} from './result';
export {Result as BuildTxResult} from './result';
export {Tx as BuildTxTrezorPrepared} from './trezor';
export {Request as BuildTxRequest} from './request';

export function buildTx(
    utxos: Array<UtxoInfo>, // all inputs
    outputs: Array<request.Request>, // all output "requests"
    height: number,
    feeRate: number, // in sat/byte, virtual size
    segwit: boolean,
    inputAmounts: boolean, // BIP 143 - not same as segwit (BCash)
    basePath: Array<number>, // for trezor inputs
    network: BitcoinJsNetwork,
    changeId: number,
    changeAddress: string
): result.Result {
    const empty = request.isEmpty(utxos, outputs);
    const countMax = request.getMax(outputs);
    const splitOutputs = request.splitByCompleteness(outputs);

    if (empty) {
        return result.empty;
    }

    const csResult: coinselect.Result = coinselect.coinselect(utxos, outputs, height, feeRate, segwit, countMax.exists, countMax.id);

    if (csResult.type === 'false') {
        return {type: 'error', error: 'NOT-ENOUGH-FUNDS'};
    } else {
        if (splitOutputs.incomplete.length > 0) {
            return result.getNonfinalResult(csResult);
        }

        const resTrezorTx = trezor.createTx(
            utxos,
            csResult.result.inputs,
            splitOutputs.complete,
            csResult.result.outputs,
            segwit,
            inputAmounts,
            basePath,
            changeId,
            changeAddress,
            network
        );
        return result.getFinalResult(csResult, resTrezorTx);
    }
}

