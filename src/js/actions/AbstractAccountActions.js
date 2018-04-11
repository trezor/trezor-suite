/* @flow */
'use strict';

import * as ACCOUNT from './constants/account';

import { initialState } from '../reducers/AbstractAccountReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';
import type { State } from '../reducers/AbstractAccountReducer';

export const init = (): any => {
    return (dispatch, getState): void => {

        const { location } = getState().router;
        const urlParams = location.params;

        const selected = findSelectedDevice( getState().connect );
        if (!selected) return;

        const state: State = {
            index: parseInt(urlParams.address),
            deviceState: selected.state,
            deviceId: selected.features.device_id,
            deviceInstance: selected.instance,
            network: urlParams.network,
            location: location.pathname
        };

        dispatch({
            type: ACCOUNT.INIT,
            state: state
        });
    }
}

export const update = (): any => {
    return (dispatch, getState): void => {
        const {
            abstractAccount,
            router
        } = getState();
        const isLocationChanged: boolean = router.location.pathname !== abstractAccount.location;
        if (isLocationChanged) {
            dispatch( init() );
            return;
        }
    }
}

export const dispose = (): any => {
    return (dispatch, getState): void => {
        dispatch({
            type: ACCOUNT.DISPOSE,
        });
    }
}