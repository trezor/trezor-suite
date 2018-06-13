/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import TXS from './nem.tests';

const PREFIX: string = 'action_nem_signtx_';
export const RESPONSE_TAB_CHANGE: string = `${PREFIX}response_tab_change`;
export const NEM_TX__RESPONSE: string = `${PREFIX}_response`;


export function onResponseTabChange(tab: string): any {
    return {
        type: RESPONSE_TAB_CHANGE,
        tab
    }
}

export function onSignTx(tx: string): any {
    return async function (dispatch, getState) {

        const response = await TrezorConnect.nemSignTransaction({
            path: "m/44'/1'/0'/0'/0'",
            transaction: TXS[tx]
        });

        dispatch({
            type: NEM_TX__RESPONSE,
            response
        });
    }
}