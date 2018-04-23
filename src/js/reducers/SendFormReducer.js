/* @flow */
'use strict';

import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';
import * as ADDRESS from '../actions/constants/address';
import EthereumjsUnits from 'ethereumjs-units';
import BigNumber from 'bignumber.js';
import { getFeeLevels } from '../actions/SendFormActions';

import type { Action } from '../flowtype';
import type { 
    Web3CreateAction,
    Web3UpdateBlockAction,
    Web3UpdateGasPriceAction 
} from '../actions/Web3Actions';

export type State = {
    +network: string;
    +coinSymbol: string;
    token: string;
    balanceNeedUpdate: boolean;
    
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
    gasPrice: string;
    data: string;
    nonce: string;
    total: string;
    sending: boolean;
    errors: {[k: string]: string};
    warnings: {[k: string]: string};
    infos: {[k: string]: string};
}

export type FeeLevel = {
    label: string;
    gasPrice: string;
    value: string;
}


export const initialState: State = {
    network: '',
    coinSymbol: '',
    token: '',

    advanced: false,
    untouched: true,
    touched: {},
    balanceNeedUpdate: false,
    address: '',
    //address: '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B',
    amount: '',
    setMax: false,
    feeLevels: [],
    selectedFeeLevel: {
        label: 'Normal',
        gasPrice: '0',
        value: 'Normal'
    },
    recommendedGasPrice: '0',
    gasPriceNeedsUpdate: false,
    gasLimit: '0',
    gasPrice: '0',
    data: '',
    nonce: '0',
    total: '0',
    sending: false,
    errors: {},
    warnings: {},
    infos: {},
}


const onGasPriceUpdated = (state: State, action: Web3UpdateGasPriceAction): State => {

    // function getRandomInt(min, max) {
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // }
    // const newPrice = getRandomInt(10, 50).toString();
    const newPrice: string = EthereumjsUnits.convert(action.gasPrice, 'wei', 'gwei');
    if (action.network === state.network && newPrice !== state.recommendedGasPrice) {
        const newState: State = { ...state };
        if (!state.untouched) {
            newState.gasPriceNeedsUpdate = true;
            newState.recommendedGasPrice = newPrice;
        } else {
            const newFeeLevels = getFeeLevels(state.network, newPrice, state.gasLimit);
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
}

const onBalanceUpdated = (state: State, action: any): State => {
    // balanceNeedUpdate
    // if (state.senderAddress === action.address) {
    //     return {
    //         ...state,
    //         balance: '1'
    //     }
    // }

    // TODO: handle balance update during send form lifecycle
    return state;
}


export default (state: State = initialState, action: Action): State => {

    switch (action.type) {

        case SEND.INIT :
            return action.state;

        case SEND.DISPOSE :
            return initialState;

        // this will be called right after Web3 instance initialization before any view is shown
        // and async during app live time
        case WEB3.GAS_PRICE_UPDATED :
            return onGasPriceUpdated(state, action);

        case ADDRESS.SET_BALANCE :
        // case ADDRESS.SET_TOKEN_BALANCE :
            return onBalanceUpdated(state, action);

        case SEND.TOGGLE_ADVANCED :
            return {
                ...state,
                advanced: !state.advanced
            }


        // user actions
        case SEND.ADDRESS_CHANGE :
        case SEND.AMOUNT_CHANGE :
        case SEND.SET_MAX :
        case SEND.CURRENCY_CHANGE :
        case SEND.FEE_LEVEL_CHANGE :
        case SEND.UPDATE_FEE_LEVELS :
        case SEND.GAS_PRICE_CHANGE :
        case SEND.GAS_LIMIT_CHANGE :
        case SEND.DATA_CHANGE :
            return action.state;

        case SEND.SEND :
            return {
                ...state,
                sending: true,
            }

        case SEND.TX_COMPLETE :
            return {
                ...state,

                sending: false,
                touched: {},
                address: '',
                amount: '',
                setMax: false,
                gasPriceNeedsUpdate: false,
                gasLimit: state.gasLimit,
                gasPrice: state.recommendedGasPrice,
                data: '',
                nonce: '0',
                total: '0',
                errors: {},
                warnings: {},
                infos: {},

            }
        case SEND.TX_ERROR :
            return {
                ...state,
                sending: false,
            }


        case SEND.VALIDATION :
            return {
                ...state,
                errors: action.errors,
                warnings: action.warnings,
                infos: action.infos,
            }

        default:
            return state;
    }

}