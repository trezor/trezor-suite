/* @flow */
'use strict';

import * as ACCOUNT from '../actions/constants/account';
import * as CONNECT from '../actions/constants/TrezorConnect';

export type State = {
    +index: number;
    +deviceState: ?string;
    +deviceId: ?string;
    +deviceInstance: ?string;
    +network: string;
    location: string;
}

export const initialState: State = {
    index: 0,
    deviceState: null,
    deviceId: null,
    deviceInstance: null,
    network: '',
    location: '',
};


export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case ACCOUNT.INIT :
            return action.state;

        case ACCOUNT.DISPOSE :
            return initialState;


        default:
            return state;
    }

}