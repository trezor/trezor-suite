/* @flow */
'use strict';

import * as STORAGE from '../actions/constants/localStorage';

type State = {
    initialized: boolean;
    error: any;
    config: any;
    ERC20Abi: any;
    tokens: any;
}

const initialState: State = {
    initialized: false,
    error: null,
    config: null,
    ERC20Abi: null,
    tokens: null,
};

export default function localStorage(state: State = initialState, action: any): any {

    switch (action.type) {

        case STORAGE.READY :
            return {
                ...state,
                initialized: true,
                config: action.config,
                ERC20Abi: action.ERC20Abi,
                tokens: action.tokens,
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