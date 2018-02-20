/* @flow */
'use strict';

import Web3 from 'web3';

import { UI, DEVICE } from 'trezor-connect';
import * as ACTIONS from '../actions';
import * as STORAGE from '../actions/constants/LocalStorage';
import * as WEB3 from '../actions/constants/Web3';

type State = {
    web3: Web3;
    url: Array<string>;
    customUrl: string;
    tokens: JSON;
    abi: JSON;
    gasPrice: any;
    latestBlock: any;
    fiatRate: ?string;
}

const initialState: State = {
    web3: null,
    url: [
        'https://ropsten.infura.io/QGyVKozSUEh2YhL4s2G4',
        'https://api.myetherapi.com/rop',
        'https://pyrus2.ubiqscan.io',
    ],
    customUrl: 's',
    gasPrice: 0,
    latestBlock: 0,
};

export default function web3(state: State = initialState, action: any): any {

    switch (action.type) {

        case 'rate__update' :
            return {
                ...state,
                fiatRate: action.rate.price_usd
            }

        case STORAGE.READY :
            return {
                ...state,
                tokens: action.tokens,
                abi: action.abi
            }
        
        case WEB3.READY :
            return {
                ...state,
                web3: action.web3
            }
        case WEB3.BLOCK_UPDATED :
            return {
                ...state,
                latestBlock: action.blockHash
            }
        case WEB3.GAS_PRICE_UPDATED :
            return {
                ...state,
                gasPrice: action.gasPrice
            }
        default:
            return state;
    }

}