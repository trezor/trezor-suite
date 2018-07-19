/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'nem_getaddress';
export const NETWORK_CHANGE: string = `${PREFIX}_network_@change`;
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

export function onNetworkChange(network: string): any {
    return {
        type: NETWORK_CHANGE,
        network
    }
}

export function onGetAddress(tx: string): any {
    return async function (dispatch, getState) {
        const params = getState().common.params;
        const bundled = params.path.split(';');
        let response;
        if (bundled.length > 1) {
            const bundle = bundled.map(b => {
                return { path: b, network: params.network, showOnTrezor: params.showOnTrezor }
            });
            response = await TrezorConnect.nemGetAddress( { bundle } );
        } else {
            response = await TrezorConnect.nemGetAddress( params );
        }

        // const response = await TrezorConnect.nemGetAddress( {
        //     //path: [-1],
        //     bundle: [ 
        //         { path: "m/44'/43'/2'", network: 104, showOnTrezor: false },
        //         { path:  "m/44'/60'/1'", network: 104, showOnTrezor: true },
        //         // { path: "m/49'/2'/1'", coin: 'litecoin' },
        //         // { path: "m/44'/2'/1'" },
        //         // { path: "m/49'/2'/1'", coin: 'btc', crossChain: true },
        //         // { path: "m/49'/156'/1'", coin: 'btg' },
        //     ]
        // });

        dispatch( onResponse(response) );
    }
}