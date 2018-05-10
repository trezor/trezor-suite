/* @flow */
'use strict';

import * as ACCOUNT from '../actions/constants/account';
import * as CONNECT from '../actions/constants/TrezorConnect';

import type { Action } from '../flowtype';
import type { Coin } from './LocalStorageReducer';

export type State = {
    +index: number;
    +deviceState: string;
    +deviceId: string;
    +deviceInstance: ?number;
    +network: string;
    +coin: Coin;
    +location: string;
};

export const initialState: ?State = null;

export default (state: ?State = initialState, action: Action): ?State => {

    switch (action.type) {

        case ACCOUNT.INIT :
            return action.state;

        case ACCOUNT.DISPOSE :
            return initialState;

        default:
            return state;
    }

}