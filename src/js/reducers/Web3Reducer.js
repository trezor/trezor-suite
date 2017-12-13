/* @flow */
'use strict';

import { UI, DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions';

type State = {
    web3: any;
}

const initialState: State = {
    web3: null,
};

export default function web3(state: State = initialState, action: any): any {

    switch (action.type) {
        
        case 'web3__init' :
            return {
                ...state,
                web3: action.web3
            }
        default:
            return state;
    }

}