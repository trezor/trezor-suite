/* @flow */


import TrezorConnect from 'trezor-connect';
import * as RECEIVE from './constants/receive';
import * as NOTIFICATION from './constants/notification';

import { initialState } from '../reducers/ReceiveReducer';
import type { State } from '../reducers/ReceiveReducer';

import type {
    TrezorDevice, ThunkAction, AsyncAction, Action, GetState, Dispatch,
} from '~/flowtype';

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
    type: typeof RECEIVE.HIDE_ADDRESS
} | {
    type: typeof RECEIVE.SHOW_UNVERIFIED_ADDRESS
}

export const init = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const state: State = {
        ...initialState,
    };

    dispatch({
        type: RECEIVE.INIT,
        state,
    });
};

export const dispose = (): Action => ({
    type: RECEIVE.DISPOSE,
});

export const showUnverifiedAddress = (): Action => ({
    type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
});

//export const showAddress = (address_n: string): AsyncAction => {
export const showAddress = (address_n: Array<number>): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const selected = getState().wallet.selectedDevice;
    if (!selected) return;

    if (selected && (!selected.connected || !selected.available)) {
        dispatch({
            type: RECEIVE.REQUEST_UNVERIFIED,
            device: selected,
        });
        return;
    }

    const response = await TrezorConnect.ethereumGetAddress({
        device: {
            path: selected.path,
            instance: selected.instance,
            state: selected.state,
        },
        path: address_n,
        useEmptyPassphrase: !selected.instance,
    });

    if (response && response.success) {
        dispatch({
            type: RECEIVE.SHOW_ADDRESS,
        });
    } else {
        dispatch({
            type: RECEIVE.HIDE_ADDRESS,
        });

        dispatch({
            type: NOTIFICATION.ADD,
            payload: {
                type: 'error',
                title: 'Verifying address error',
                message: response.payload.error,
                cancelable: true,
                actions: [
                    {
                        label: 'Try again',
                        callback: () => {
                            dispatch(showAddress(address_n));
                        },
                    },
                ],
            },
        });
    }
};

export default {
    init,
    dispose,
    showAddress,
    showUnverifiedAddress,
};