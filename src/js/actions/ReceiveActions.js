/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import * as RECEIVE from './constants/receive';
import * as NOTIFICATION from './constants/notification';

import { initialState } from '../reducers/ReceiveReducer';
import type { State } from '../reducers/ReceiveReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';

import type { TrezorDevice, ThunkAction, AsyncAction, Action, GetState, Dispatch } from '../flowtype';

export type ReceiveAction = {
    type: typeof RECEIVE.INIT,
    state: State
} | {
    type: typeof RECEIVE.DISPOSE,
} | {
    type: typeof RECEIVE.REQUEST_UNVERIFIED,
    device: TrezorDevice
} | {
    type: typeof RECEIVE.SHOW_ADDRESS
} | {
    type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS
}

export const init = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
    
        const state: State = {
            ...initialState,
        };

        dispatch({
            type: RECEIVE.INIT,
            state: state
        });
    }
}

export const dispose = (): Action  => {
    return {
        type: RECEIVE.DISPOSE
    }
}

export const showUnverifiedAddress = (): Action => {
    return {
        type: RECEIVE.SHOW_UNVERIFIED_ADDRESS
    }
}

//export const showAddress = (address_n: string): AsyncAction => {
export const showAddress = (address_n: Array<number>): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const selected = findSelectedDevice(getState().connect);
        if (!selected) return;

        if (selected && (!selected.connected || !selected.available)) {
            dispatch({
                type: RECEIVE.REQUEST_UNVERIFIED,
                device: selected
            });
            return;
        }

        const response = await TrezorConnect.ethereumGetAddress({ 
            device: {
                path: selected.path,
                instance: selected.instance,
                state: selected.state
            },
            path: address_n,
        });

        if (response && response.success) {
            dispatch({
                type: RECEIVE.SHOW_ADDRESS
            })
        } else {
            // TODO: handle invalid pin?
            dispatch({
                type: NOTIFICATION.ADD,
                payload: {
                    type: 'error',
                    title: 'Veryfying address error',
                    message: response.payload.error,
                    cancelable: true,
                    actions: [
                        {
                            label: 'Try again',
                            callback: () => {
                                dispatch(showAddress(address_n))
                            }
                        }
                    ]
                }
            })
        }
    }
}

export default {
    init,
    dispose,
    showAddress,
    showUnverifiedAddress
}