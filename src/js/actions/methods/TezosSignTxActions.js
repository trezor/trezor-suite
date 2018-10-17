/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'tezos_signtx';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const BRANCH_CHANGE: string = `${PREFIX}_branch_@change`;
export const OPERATION_CHANGE: string = `${PREFIX}_operation_@change`;

export function onOperationChange(operation: string): any {
    return {
        type: OPERATION_CHANGE,
        oparation
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onBranchChange(branch: string): any {
    return {
        type: BRANCH_CHANGE,
        branch
    }
}

export function onSignTx(): any {
    return async function (dispatch, getState) {
        const { path, branch, operation } = getState().tezossigntx;

        const op = eval(`[${operation}]`);
        const response = await TrezorConnect.tezosSignTransaction({
            path,
            branch,
            operation: op[0]
        });

        dispatch( onResponse(response) );
    }
}