/* @flow */
'use strict';

import * as STORAGE from '../actions/constants/LocalStorage';

type State = {
    initialized: boolean;
    error: any;
    config: any;
    ethERC20: any;
    ethTokens: any;
}

const initialState: State = {
    initialized: false,
    error: null,
    config: null,
    ethERC20: null,
    ethTokens: null,
};

export default function localStorage(state: State = initialState, action: any): any {

    switch (action.type) {

        case STORAGE.READY :
            return {
                ...state,
                initialized: true,
                config: action.appConfig,
                ethERC20: action.ethERC20,
                ethTokens: action.ethTokens,
                error: null
            }

        case STORAGE.ERROR :
            return {
                ...state,
                error: action.error
            }

    
        default:
            return state;
    }

}