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

        // const response = await TrezorConnect.nemGetAddress({
        //     //...params,
        //     path: "m/44'/43'/0'",
        //     network:  0x68 // 98, 60
        // });


        /*
        const response = await TrezorConnect.customMessage({
            customFunction: function(sendMessage) {
                return new Promise(function(resolve, reject) {
                    //sendMessage('StellarGetPublicKey', { address_n: [2147483694, 2147483708, 2147483648] })
                    // sendMessage('StellarGetPublicKey', { address_n: [44 | 0x80000000, 148 | 0x80000000, 0 | 0x80000000] })
                    // sendMessage('StellarGetPublicKey', { address_n: [44 , 148 , 0 ] })
                    //sendMessage('NEMGetAddress', { address_n: [2147483694, 2147483708, 2147483648], network: 0x68, show_display: true })
                    // sendMessage('NEMGetAddress', { address_n: [1, 0, 0], network: 0x68, show_display: true })

                    // protocol_version
                    // network_passphrase
                    // source_account
                    // sendMessage('StellarSignTx', { address_n: [2147483694, 2147483708, 2147483648] })
                    // .then(function(response) {

                    //     if (response && response.type === 'StellarTxOpRequest') {
                    //         sendMessage('StellarPaymentOp', {})
                    //         .then(function(rr) {
                    //             console.warn("RR", rr)

                    //             resolve(response);
                    //         })
                    //     }

                       
                    // }).catch( function(error) {
                    //     reject(error);
                    // });



                    sendMessage('StellarGetPublicKey', { address_n: [2147483694, 2147483708, 2147483648] })
                    .then(function(response) {
                        resolve(response);
                    }).catch( function(error) {
                        reject(error);
                    });
                });
            }
        });
        */

        dispatch({
            type: GETXPUB_RESPONSE,
            response
        });
    }
}