/* @flow */
'use strict';

import * as LocalStorageActions from '../actions/LocalStorageActions';
import * as SendFormActions from '../actions/SendFormActions';

import { DEVICE } from 'trezor-connect';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as MODAL from '../actions/constants/modal';
import * as TOKEN from '../actions/constants/token';
import * as ACCOUNT from '../actions/constants/account';
import * as DISCOVERY from '../actions/constants/discovery';
import * as SEND from '../actions/constants/send';
import * as WEB3 from '../actions/constants/web3';
import * as PENDING from '../actions/constants/pendingTx';
import { LOCATION_CHANGE } from 'react-router-redux';
import { findAccountTokens } from '../reducers/TokensReducer';

import type { 
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    AsyncAction,
    GetState 
} from '../flowtype';

import type { TrezorDevice } from '../flowtype';
import type { Account } from '../reducers/AccountsReducer';
import type { Token } from '../reducers/TokensReducer';
import type { PendingTx } from '../reducers/PendingTxReducer';
import type { Discovery } from '../reducers/DiscoveryReducer';


const save = (dispatch: Dispatch, getState: GetState): void => {

    if (typeof window.sessionStorage === 'undefined') return;

    const accountState = getState().abstractAccount;
    const sendState = getState().sendForm;
    if (accountState && !sendState.untouched) {
        const value = {
            address: sendState.address,
            amount: sendState.amount,
            setMax: sendState.setMax,
            selectedCurrency: sendState.selectedCurrency,
            selectedFeeLevel: sendState.selectedFeeLevel,
            advanced: sendState.advanced,
            gasLimit: sendState.gasLimit,
            gasPrice: sendState.gasPrice,
            data: sendState.data,
            nonce: sendState.nonce,
            touched: sendState.touched
        }

        try {
            window.sessionStorage.setItem(`SEND:${accountState.location}`, JSON.stringify(value) );
        } catch (error) {
            console.error("Saving sessionStorage error: " + error)
        }
        
    }

    
}

const load = (dispatch: Dispatch, getState: GetState): void => {

    if (typeof window.localStorage === 'undefined') return;

    const accountState = getState().abstractAccount;
    const sendState = getState().sendForm;

    if (accountState) {
        try {
            const key: string = `SEND:${accountState.location}`;
            const value: string = window.sessionStorage.getItem(key);
            const json = JSON.parse(value);

            if (json) {

                // check if this token still exists in user tokens list
                if (json.selectedCurrency !== sendState.coinSymbol) {
                    const token = getState().tokens.find(t => t.symbol === json.selectedCurrency);
                    if (!token) {
                        window.sessionStorage.removeItem(key);
                        return;
                    }
                }

                dispatch({
                    type: SEND.FROM_SESSION_STORAGE,
                    address: json.address,
                    amount: json.amount,
                    setMax: false,
                    selectedCurrency: json.selectedCurrency,
                    selectedFeeLevel: json.selectedFeeLevel,
                    advanced: json.advanced,
                    gasLimit: json.gasLimit,
                    gasPrice: json.gasPrice,
                    data: json.data,
                    nonce: json.nonce,
                    touched: json.touched,
                });

                if (json.setMax) {
                    dispatch(SendFormActions.onSetMax());
                } else {
                    dispatch(SendFormActions.validation());
                }

                
            }
        } catch (error) {
            console.error("Loading sessionStorage error: " + error)
        }
    }
}


const LocalStorageService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {

    if (action.type === ACCOUNT.DISPOSE) {
    // if (action.type === SEND.DISPOSE) {
        // save fields before dispose action
        save(api.dispatch, api.getState);
    }

    next(action);
    

    switch (action.type) {

        // load fields after action
        case SEND.INIT :
            load(api.dispatch, api.getState);
        break;
    }

    return action;
};

export default LocalStorageService;