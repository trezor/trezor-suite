/* @flow */
'use strict';

import * as ACTIONS from '../actions/index';

type State = {
    address: string;
    amount: number;
    gasPrice: number;
    gasLimit: number;
    data: string;
}

const initialState: State = {
    //address: '0x7314e0f1C0e28474bDb6be3E2c3E0453255188f8', //metamask acc1
    address: '0xa738ea40b69d87f4f9ac94c9a0763f96248df23b', // trezor acc3
    amount: 0.0001,
    gasPrice: 0,
    gasPriceChanged: false,
    gasLimit: 21000,
    data: ''
};

export default (state: State = initialState, action: any): State => {

    switch (action.type) {

        case 'update_gas' :
            if (!state.gasPriceChanged) {
                return {
                    ...state,
                    gasPrice: action.gasPrice
                }
            }
            return {
                ...state,
            }
            
        
        case ACTIONS.ON_ADDRESS_CHANGE :
            return {
                ...state,
                address: action.address
            }

        case ACTIONS.ON_AMOUNT_CHANGE :
            return {
                ...state,
                amount: action.amount
            }

        case ACTIONS.ON_GAS_PRICE_CHANGE :
            return {
                ...state,
                gasPriceChanged: true,
                gasPrice: action.gasPrice
            }

        case ACTIONS.ON_GAS_LIMIT_CHANGE :
            return {
                ...state,
                gasLimit: action.gasLimit
            }

        case ACTIONS.ON_TX_DATA_CHANGE :
            return {
                ...state,
                data: action.data
            }

        default:
            return state;
    }

}