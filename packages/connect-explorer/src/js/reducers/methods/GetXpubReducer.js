/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { UI, DEVICE } from 'trezor-connect';
import * as GetXpubActions from '../../actions/methods/GetXpubActions';

type MethodState = {
    coin: string;
    type: string;
    path: string;
    accountID: number;
    accountLegacy: boolean;
    confirmation: boolean;

    responseTab: string;
    response: ?Object;
    code: string;
    params: Object;
}


const getCode = (params): string => {
    return 'TrezorConnect.getPublicKey(' + JSON.stringify(params, undefined, 2) + ');';    
}

const getParams = (state: MethodState): Object => {
    var params = {
        //selectedDevice: window.selectedDevice,
        coin: state.coin,
    };

    if (state.type === 'path') {
        params.path = state.path;
    } else if (state.type === 'account') {
        params.account = state.accountID;
        if (state.accountLegacy)
            params.accountLegacy = state.accountLegacy;
    }

    if (!state.confirmation && state.type !== 'discovery') {
        params.confirmation = state.confirmation;
    }
    return params;
}

const updateState = (state: MethodState): MethodState => {
    const params: Object = getParams(state);
    return {
        ...state,
        params,
        code: getCode(params)
    }
}

const defaultPaths = {
    "btc":   "m/49'/0'/0'",
    "bch":   "m/44'/145'/0'",
    "btg":   "m/44'/156'/0'",
    "ltc":   "m/49'/2'/0'",
    "dash":  "m/44'/5'/0'",
    "zcash": "m/44'/133'/0'",
    "test":  "m/49'/1'/0'",
    "doge":  "m/44'/3'/0'",
    "nmc":   "m/44'/7'/0'",
}

const initialState: MethodState = {
    coin: 'test',
    type: 'path',
    path: "m/49'/1'/0'",
    accountID: 0,
    accountLegacy: false,
    responseTab: 'response',
    confirmation: true,

    response: null,
    code: '',
    params: {}
};
initialState.params = getParams(initialState);


export default function method(state: MethodState = initialState, action: any): any {

    switch (action.type) {

        case LOCATION_CHANGE: {
            return updateState({ 
                ...initialState
            });
        }

        case GetXpubActions.COIN_CHANGE :
            return updateState({
                ...state,
                coin: action.coin,
                path: defaultPaths[action.coin]
            });

        case GetXpubActions.TYPE_CHANGE :
            return updateState({
                ...state,
                type: action.getxpub_type
            });

        case GetXpubActions.PATH_CHANGE :
            return updateState({
                ...state,
                path: action.path
            });

        case GetXpubActions.ACCOUNT_CHANGE :
            return updateState({
                ...state,
                accountID: action.accountID
            });

        case GetXpubActions.ACCOUNT_TYPE_CHANGE :
            return updateState({
                ...state,
                accountLegacy: action.accountLegacy
            });

        case GetXpubActions.CONFIRMATION_CHANGE :
            return updateState({
                ...state,
                confirmation: action.confirmation
            });

        case GetXpubActions.RESPONSE_TAB_CHANGE :
            return updateState({
                ...state,
                responseTab: action.tab
            });
        
        case GetXpubActions.GETXPUB_RESPONSE :
            return {
                ...state,
                response: action.response,
                responseTab: 'response'
            };


        default:
            return state;
    }

}