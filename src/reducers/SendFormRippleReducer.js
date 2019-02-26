/* @flow */

import * as SEND from 'actions/constants/send';
import * as ACCOUNT from 'actions/constants/account';

import type { Action } from 'flowtype';

export type FeeLevel = {
    label: string;
    fee: string;
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
    minAmount: string;
    setMax: boolean;
    feeLevels: Array<FeeLevel>;
    selectedFeeLevel: FeeLevel;
    fee: string;
    feeNeedsUpdate: boolean;
    sequence: string;
    destinationTag: string;
    total: string;

    errors: {[k: string]: string};
    warnings: {[k: string]: string};
    infos: {[k: string]: string};

    sending: boolean;
}


export const initialState: State = {
    networkName: '',
    networkSymbol: '',

    advanced: false,
    untouched: true,
    touched: {},
    address: '',
    amount: '',
    minAmount: '0',
    setMax: false,
    feeLevels: [],
    selectedFeeLevel: {
        value: 'Normal',
        label: '',
        fee: '0',
    },
    fee: '0',
    feeNeedsUpdate: false,
    sequence: '0',
    destinationTag: '',
    total: '0',

    errors: {},
    warnings: {},
    infos: {},

    sending: false,
};

export default (state: State = initialState, action: Action): State => {
    if (action.type === ACCOUNT.DISPOSE) return initialState;
    if (!action.networkType || action.networkType !== 'ripple') return state;

    switch (action.type) {
        case SEND.INIT:
        case SEND.CHANGE:
        case SEND.VALIDATION:
        case SEND.CLEAR:
            return action.state;

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