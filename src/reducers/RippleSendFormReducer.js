/* @flow */

import * as SEND from 'actions/constants/send';
import * as ACCOUNT from 'actions/constants/account';

import type { Action } from 'flowtype';

export type FeeLevel = {
    label: string;
    gasPrice: string;
    value: string;
}

export type State = {
    +networkName: string;
    +networkSymbol: string;

    // form fields
    advanced: boolean;
    untouched: boolean; // set to true when user made any changes in form
    touched: {[k: string]: boolean};
    address: string;
    amount: string;
    setMax: boolean;
    feeLevels: Array<FeeLevel>;
    selectedFeeLevel: FeeLevel;
    sequence: string;
    total: string;

    errors: {[k: string]: string};
    warnings: {[k: string]: string};
    infos: {[k: string]: string};

    sending: boolean;
}


export const initialState: State = {
    networkName: '',
    networkSymbol: '',
    currency: '',

    advanced: false,
    untouched: true,
    touched: {},
    address: '',
    //address: '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B',
    amount: '',
    setMax: false,
    feeLevels: [],
    selectedFeeLevel: {
        label: 'Normal',
        gasPrice: '0',
        value: 'Normal',
    },
    sequence: '0',
    total: '0',
    sending: false,
    errors: {},
    warnings: {},
    infos: {},
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case SEND.INIT:
        case SEND.CHANGE:
        case SEND.VALIDATION:
            // return action.state;
            return state;

        case ACCOUNT.DISPOSE:
            return initialState;


        case SEND.TOGGLE_ADVANCED:
            return {
                ...state,
                advanced: !state.advanced,
            };

        case SEND.TX_SENDING:
            return {
                ...state,
                sending: true,
            };

        case SEND.TX_ERROR:
            return {
                ...state,
                sending: false,
            };

        default:
            return state;
    }
};