/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';


export const COIN_CHANGE: string = 'action__getxpub_coin_change';
export const RESPONSE_TAB_CHANGE: string = 'action__getxpub_response_tab_change';
export const GETXPUB_RESPONSE: string = 'action__getxpub_response';
export const TYPE_CHANGE: string = 'action__getxpub_type_change';
export const PATH_CHANGE: string = 'action__getxpub_path_change';
export const ACCOUNT_CHANGE: string = 'action__getxpub_account_change';
export const ACCOUNT_TYPE_CHANGE: string = 'action__getxpub_account_type_change';
export const CONFIRMATION_CHANGE: string = 'action__getxpub_confirmation_change';


export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onTypeChange(type: string): any {
    return {
        type: TYPE_CHANGE,
        getxpubType: type
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onAccountChange(id: string): any {
    return {
        type: ACCOUNT_CHANGE,
        accountID: parseInt(id)
    }
}

export function onAccountTypeChange(status: boolean): any {
    return {
        type: ACCOUNT_TYPE_CHANGE,
        accountLegacy: status
    }
}

export function onConfirmationChange(status: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        confirmation: status
    }
}

export function onResponseTabChange(tab: string): any {
    return {
        type: RESPONSE_TAB_CHANGE,
        tab
    }
}

export function onGetXpub(params: any): any {
    return async function (dispatch, getState) {
      
        const response = await TrezorConnect.getPublicKey({
            //...params,
            path: "m/46'/60'/0'",
            transformFormat: true,
            useEmptyPassphrase: false,
        });

        dispatch({
            type: GETXPUB_RESPONSE,
            response
        });
    }
}