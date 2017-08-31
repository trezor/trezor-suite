/* @flow */

import * as trezor from './trezor';
import * as coinselect from './coinselect';

// ---------- Output from algorigthm
// 'nonfinal' - contains info about the outputs, but not Trezor tx
// 'final' - contains info about outputs + Trezor tx
// 'error' - some error, so far only NOT-ENOUGH-FUNDS and EMPTY strings
export type Result = {
    type: 'error',
    error: string,
} | {
    type: 'nonfinal',
    max: number,
    totalSpent: number, // all the outputs, no fee, no change
    fee: number,
    feePerByte: number,
    bytes: number,
} | {
    type: 'final',
    max: number,
    totalSpent: number, // all the outputs, no fee, no change
    fee: number,
    feePerByte: number,
    bytes: number,
    trezorTx: trezor.Tx,
};

export const empty: Result = {
    type: 'error',
    error: 'EMPTY',
};

export function getNonfinalResult(result: coinselect.CompleteResult): Result {
    const max = result.result.max;
    const fee = result.result.fee;
    const feePerByte = result.result.feePerByte;
    const bytes = result.result.bytes;
    const totalSpent = result.result.totalSpent;

    return {
        type: 'nonfinal',
        fee,
        feePerByte,
        bytes,
        max,
        totalSpent,
    };
}

export function getFinalResult(
    result: coinselect.CompleteResult,
    trezorTx: trezor.Tx
): Result {
    const max = result.result.max;
    const fee = result.result.fee;
    const feePerByte = result.result.feePerByte;
    const bytes = result.result.bytes;
    const totalSpent = result.result.totalSpent;

    return {
        type: 'final',
        fee,
        feePerByte,
        bytes,
        trezorTx,
        max,
        totalSpent,
    };
}

