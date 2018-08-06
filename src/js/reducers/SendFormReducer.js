/* @flow */


import EthereumjsUnits from 'ethereumjs-units';
import BigNumber from 'bignumber.js';
import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';
import * as ACCOUNT from '../actions/constants/account';
import * as WALLET from '../actions/constants/wallet';

import { getFeeLevels } from '../actions/SendFormActions';

import type { Action } from '~/flowtype';
import type {
    Web3UpdateGasPriceAction,
} from '../actions/Web3Actions';

export type State = {
    +networkName: string;
    +networkSymbol: string;
    currency: string;

    // form fields
    advanced: boolean;
    untouched: boolean; // set to true when user made any changes in form
    touched: {[k: string]: boolean};
    address: string;
    amount: string;
    setMax: boolean;
    feeLevels: Array<FeeLevel>;
    selectedFeeLevel: FeeLevel;
    recommendedGasPrice: string;
    gasPriceNeedsUpdate: boolean;
    gasLimit: string;
    calculatingGasLimit: boolean;
    gasPrice: string;
    data: string;
    nonce: string;
    total: string;

    errors: {[k: string]: string};
    warnings: {[k: string]: string};
    infos: {[k: string]: string};

    sending: boolean;
}

export type FeeLevel = {
    label: string;
    gasPrice: string;
    value: string;
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
    recommendedGasPrice: '0',
    gasPriceNeedsUpdate: false,
    gasLimit: '0',
    calculatingGasLimit: false,
    gasPrice: '0',
    data: '',
    nonce: '0',
    total: '0',
    sending: false,
    errors: {},
    warnings: {},
    infos: {},
};


const onGasPriceUpdated = (state: State, action: Web3UpdateGasPriceAction): State => {
    // function getRandomInt(min, max) {
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // }
    // const newPrice = getRandomInt(10, 50).toString();
    const newPrice: string = EthereumjsUnits.convert(action.gasPrice, 'wei', 'gwei');
    if (action.network === state.networkName && newPrice !== state.recommendedGasPrice) {
        const newState: State = { ...state };
        if (!state.untouched) {
            newState.gasPriceNeedsUpdate = true;
            newState.recommendedGasPrice = newPrice;
        } else {
            const newFeeLevels = getFeeLevels(state.networkSymbol, newPrice, state.gasLimit);
            const selectedFeeLevel: ?FeeLevel = newFeeLevels.find(f => f.value === 'Normal');
            if (!selectedFeeLevel) return state;
            newState.recommendedGasPrice = newPrice;
            newState.feeLevels = newFeeLevels;
            newState.selectedFeeLevel = selectedFeeLevel;
            newState.gasPrice = selectedFeeLevel.gasPrice;
        }
        return newState;
    }
    return state;
};


export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case SEND.INIT:
            return action.state;

        case ACCOUNT.DISPOSE:
            return initialState;

        // this will be called right after Web3 instance initialization before any view is shown
        // and async during app live time
        case WEB3.GAS_PRICE_UPDATED:
            return onGasPriceUpdated(state, action);


        case SEND.TOGGLE_ADVANCED:
            return {
                ...state,
                advanced: !state.advanced,
            };


        // user actions
        case SEND.ADDRESS_CHANGE:
        case SEND.ADDRESS_VALIDATION:
        case SEND.AMOUNT_CHANGE:
        case SEND.SET_MAX:
        case SEND.CURRENCY_CHANGE:
        case SEND.FEE_LEVEL_CHANGE:
        case SEND.UPDATE_FEE_LEVELS:
        case SEND.GAS_PRICE_CHANGE:
        case SEND.GAS_LIMIT_CHANGE:
        case SEND.NONCE_CHANGE:
        case SEND.DATA_CHANGE:
            return action.state;

        case SEND.SEND:
            return {
                ...state,
                sending: true,
            };

        case SEND.TX_ERROR:
            return {
                ...state,
                sending: false,
            };

        case SEND.VALIDATION:
            return {
                ...state,
                errors: action.errors,
                warnings: action.warnings,
                infos: action.infos,
            };

        case SEND.FROM_SESSION_STORAGE:
            return {
                ...state,

                address: action.address,
                amount: action.amount,
                setMax: action.setMax,
                selectedCurrency: action.selectedCurrency,
                selectedFeeLevel: action.selectedFeeLevel,
                advanced: action.advanced,
                gasLimit: action.gasLimit,
                gasPrice: action.gasPrice,
                data: action.data,
                nonce: action.nonce,
                untouched: false,
                touched: action.touched,
            };

        default:
            return state;
    }
};