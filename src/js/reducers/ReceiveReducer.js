/* @flow */
'use strict';

import * as RECEIVE from '../actions/constants/receive';

export type State = {
    +deviceState: ?string;
    +deviceId: ?string;
    +deviceInstance: ?string;
    +accountIndex: ?number;
    +network: ?string;
    location: string;
    addressVerified: boolean;
    adressUnverified: boolean;
}

export const initialState: State = {
    deviceState: null,
    deviceId: null,
    deviceInstance: null,
    accountIndex: null,
    network: null,
    location: '',
    addressVerified: false,
    addressUnverified: false,
};

export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case RECEIVE.INIT :
            return action.state;

        case RECEIVE.DISPOSE :
            return initialState;

        case RECEIVE.SHOW_ADDRESS :
            return {
                ...state,
                addressVerified: true,
                addressUnverified: false
            }
        case RECEIVE.SHOW_UNVERIFIED_ADDRESS :
            return {
                ...state,
                addressVerified: false,
                addressUnverified: true
            }

        default:
            return state;
    }

}