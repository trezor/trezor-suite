/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { CONFIRMATION_CHANGE, PATH_CHANGE } from '../../actions/methods/StellarGetAddressActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    path: string;
    showOnTrezor: boolean;
}

const initialState: MethodState = {
    js: 'TrezorConnect.stellarGetAddress',
    fields: ['path', 'showOnTrezor'],

    path: "m/44'/148'/0'",
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