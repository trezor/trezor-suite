/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'eth_getaddress';
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const CONFIRMATION_CHANGE: string = `${PREFIX}_confirmation_@change`;

export function onConfirmationChange(showOnTrezor: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        showOnTrezor
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onGetAddress(tx: string): any {
    return async function (dispatch, getState) {

        const bundled = getState().common.params.path.split(';');
        let response;
        if (bundled.length > 1) {
            const bundle = bundled.map(b => {
                return { path: b, showOnTrezor: getState().common.params.showOnTrezor }
            });
            response = await TrezorConnect.ethereumGetAddress( { bundle } );
        } else {
            response = await TrezorConnect.ethereumGetAddress( getState().common.params );
        }

        // const response = await TrezorConnect.ethereumGetAddress( getState().common.params );

        // const response = await TrezorConnect.ethereumGetAddress( {
        //     //path: [-1],
        //     bundle: [ 
        //         { path: "m/44'/137'/0'", showOnTrezor: false },
        //         { path:  "m/44'/137'/1'", showOnTrezor: true },
        //         // { path: "m/49'/2'/1'", coin: 'litecoin' },
        //         // { path: "m/44'/2'/1'" },
        //         // { path: "m/49'/2'/1'", coin: 'btc', crossChain: true },
        //         // { path: "m/49'/156'/1'", coin: 'btg' },
        //     ]
        // });

        dispatch( onResponse(response) );
    }
}