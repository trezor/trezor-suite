/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { CONFIRMATION_CHANGE, PATH_CHANGE } from '../../actions/methods/EthereumGetAddressActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    showOnTrezor: boolean;
}

const initialState: MethodState = {
    js: 'TrezorConnect.ethereumGetAddress',
    fields: ['path', 'showOnTrezor'],

    path: "m/44'/60'/0'/0/0",
    showOnTrezor: true,
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case PATH_CHANGE :
            return {
                ...state,
                path: action.path
            };

        case CONFIRMATION_CHANGE :
            return {
                ...state,
                showOnTrezor: action.showOnTrezor
            };

        default:
            return state;
    }
}