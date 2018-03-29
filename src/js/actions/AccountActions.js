/* @flow */
'use strict';

import * as ACCOUNT from './constants/account';

import { initialState } from '../reducers/AccountDetailReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';

import type { State } from '../reducers/AccountDetailReducer';
import type { Discovery } from '../reducers/DiscoveryReducer';

export const init = (): any => {
    return (dispatch, getState): void => {

        const { location } = getState().router;
        const urlParams = location.params;

        const selected = findSelectedDevice( getState().connect );
        if (!selected) return;


        const state: State = {
            index: parseInt(urlParams.address),
            deviceState: selected.state,
            network: urlParams.network,
            location: location.pathname
        };

        dispatch({
            type: ACCOUNT.INIT,
            state: state
        });
    }
}

export const update = (newProps: any): any => {
    return (dispatch, getState): void => {

        const {
            accountDetail,
            connect,
            discovery,
            accounts,
            router
        } = getState();

        const isLocationChanged: boolean = newProps.location.pathname !== accountDetail.location;
        
        if (isLocationChanged) {
            dispatch({
                type: ACCOUNT.INIT,
                state: {
                    ...accountDetail,
                    location: newProps.location.pathname,
                }
            });
            return;
        }
    }
}

export const dispose = (device: any): any => {
    return (dispatch, getState): void => {
        dispatch({
            type: ACCOUNT.DISPOSE,
        });
    }
}