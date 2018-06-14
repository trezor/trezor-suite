/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { CONFIRMATION_CHANGE, NETWORK_CHANGE, PATH_CHANGE } from '../../actions/methods/NEMGetAddressActions';

type MethodState = {
    +js: string;
    +fields: Array<string>;

    network: number;
    path: string;
    showOnTrezor: boolean;
}

const initialState: MethodState = {
    js: 'TrezorConnect.nemGetAddress',
    fields: ['network', 'path', 'showOnTrezor'],

    network: 152,
    path: "m/44'/43'/0'",
    showOnTrezor: true,
};

export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE :
            return initialState;

        case NETWORK_CHANGE :
            return {
                ...state,
                network: parseInt(action.network)
            };

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