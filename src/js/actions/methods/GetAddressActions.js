/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import { onResponse } from './CommonActions';

const PREFIX: string = 'getaddress';
export const COIN_CHANGE: string = `${PREFIX}_coin_@change`;
export const PATH_CHANGE: string = `${PREFIX}_path_@change`;
export const ADDRESS_CHANGE: string = `${PREFIX}_address_@change`;
export const CONFIRMATION_CHANGE: string = `${PREFIX}_confirmation_@change`;

export function onCoinChange(coin: string): any {
    return {
        type: COIN_CHANGE,
        coin
    }
}

export function onPathChange(path: string): any {
    return {
        type: PATH_CHANGE,
        path
    }
}

export function onAddressChange(address: string): any {
    return {
        type: ADDRESS_CHANGE,
        address
    }
}

export function onConfirmationChange(showOnTrezor: boolean): any {
    return {
        type: CONFIRMATION_CHANGE,
        showOnTrezor
    }
}

export function onGetAddress(): any {
    return async function (dispatch, getState) {
        const bundled = getState().common.params.path.split(';');
        let response;
        if (bundled.length > 1) {
            const bundle = bundled.map(b => {
                return { path: b, showOnTrezor: getState().common.params.showOnTrezor }
            });
            response = await TrezorConnect.getAddress( { bundle } );
        } else {
            if (getState().getaddress.address.length > 0) {
                response = await TrezorConnect.getAddress( { ...getState().common.params, address: getState().getaddress.address } );
            } else {
                response = await TrezorConnect.getAddress( { ...getState().common.params } );
            }
        }

        // const response = await TrezorConnect.getAddress(getState().common.params);

        // const response = await TrezorConnect.getAddress( {
        //     //path: [-1],
        //     bundle: [ 
        //         { path: "m/49'/0'/0'/0/0", showOnTrezor: false },
        //         { path:  "m/44'/0'/1'/0/0", coin: 'btc', showOnTrezor: false },
        //         // { path: "m/49'/2'/1'", coin: 'litecoin' },
        //         // { path: "m/44'/2'/1'" },
        //         // { path: "m/49'/2'/1'", coin: 'btc', crossChain: true },
        //         // { path: "m/49'/156'/1'", coin: 'btg' },
        //     ]
        // });

        dispatch( onResponse(response) );
    }
}

