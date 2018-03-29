/* @flow */
'use strict';

import * as ACCOUNT from '../actions/constants/account';
import * as CONNECT from '../actions/constants/TrezorConnect';

export type State = {
    +index: number;
    +ch: ?string;
    +network: string;
    location: string;
}

export const initialState: State = {
    index: 0,
    deviceState: null,
    network: '',
};


export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case ACCOUNT.INIT :
            return action.state;

        case CONNECT.DEVICE_STATE_EXCEPTION :
            return {
                ...state,
                deviceStateError: true
            }

        case ACCOUNT.DISPOSE :
            return initialState;


        default:
            return state;
    }

}