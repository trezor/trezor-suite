/* @flow */
'use strict';

import TrezorConnect from 'trezor-connect';
import * as RECEIVE from './constants/receive';
import * as NOTIFICATION from './constants/notification';

import { initialState } from '../reducers/ReceiveReducer';
import type { State } from '../reducers/ReceiveReducer';
import { findSelectedDevice } from '../reducers/TrezorConnectReducer';


export const init = (): any => {
    return (dispatch, getState): void => {
        const { location } = getState().router;
        const urlParams = location.params;

        const selected = findSelectedDevice( getState().connect );
        if (!selected) return;

        const state: State = {
            ...initialState,
            deviceState: selected.state,
            deviceId: selected.features.device_id,
            deviceInstance: selected.instance,
            accountIndex: parseInt(urlParams.address),
            network: urlParams.network,
            location: location.pathname,
        };

        dispatch({
            type: RECEIVE.INIT,
            state: state
        });
    }
}


export const update = (newProps: any): any => {
    return (dispatch, getState): void => {
        const {
            receive,
            router
        } = getState();

        const isLocationChanged: boolean = router.location.pathname !== receive.location;
        if (isLocationChanged) {
            dispatch( init() );
            return;
        }
    }
}

export const dispose = (address: string): any => {
    return {
        type: RECEIVE.DISPOSE
    }
}

export const showUnverifiedAddress = () => {
    return {
        type: RECEIVE.SHOW_UNVERIFIED_ADDRESS
    }
}

export const showAddress = (address_n: string): any => {
    return async (dispatch, getState) => {

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