/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as ACCOUNT from './constants/account';
import * as SEND from './constants/send';

import * as SendFormActions from './SendFormActions';
import * as SessionStorageActions from './SessionStorageActions';
import * as stateUtils from '../reducers/utils';

import { initialState } from '../reducers/SelectedAccountReducer';

import type {
    Coin,
    TrezorDevice,
    AsyncAction,
    ThunkAction,
    Action, 
    GetState, 
    Dispatch,
    State,
} from '~/flowtype';


export type SelectedAccountAction = {
    type: typeof ACCOUNT.DISPOSE,
} | {
    type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload: $ElementType<State, 'selectedAccount'>
};

export const updateSelectedValues = (prevState: State, action: Action): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const locationChange: boolean = action.type === LOCATION_CHANGE;
        const state: State = getState();
        const location = state.router.location;
        const prevLocation = prevState.router.location;

        let needUpdate: boolean = false;

        // reset form to default
        if (action.type === SEND.TX_COMPLETE) {
            dispatch( SendFormActions.init() );
            // linear action
            SessionStorageActions.clear(location.pathname);
        }

        // handle devices state change (from trezor-connect events or location change)
        if (locationChange
            || prevState.accounts !== state.accounts
            || prevState.discovery !== state.discovery
            || prevState.tokens !== state.tokens
            || prevState.pending !== state.pending
            || prevState.web3 !== state.web3) {
            
            const account = stateUtils.getSelectedAccount(state);
            const network = stateUtils.getSelectedNetwork(state);
            const discovery = stateUtils.getDiscoveryProcess(state);
            const tokens = stateUtils.getAccountTokens(state, account);
            const pending = stateUtils.getAccountPendingTx(state.pending, account);
            const web3 = stateUtils.getWeb3(state);

            const payload: $ElementType<State, 'selectedAccount'> = {
                // location: location.pathname,
                account,
                network,
                discovery,
                tokens,
                pending,
                web3
            }

            let needUpdate: boolean = false;
            Object.keys(payload).forEach((key) => {
                if (payload[key] !== state.selectedAccount[key]) {
                    needUpdate = true;
                }
            })

            if (needUpdate) {
                dispatch({
                    type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
                    payload,
                });
            }

            if (locationChange) {

                if (prevLocation) {
                    // save form data to session storage
                    // TODO: move to state.sendForm on change event
                    if (prevLocation.state.send) {
                        SessionStorageActions.save(prevState.router.location.pathname, state.sendForm);
                    }
                }

                dispatch( dispose() );
                if (location.state.send) {
                    dispatch( SendFormActions.init( SessionStorageActions.load(location.pathname) ) );
                }
            }
        }
    }
}

export const dispose = (): Action => {
    return {
        type: ACCOUNT.DISPOSE
    }
}