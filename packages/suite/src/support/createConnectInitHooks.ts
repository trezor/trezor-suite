import { type Dispatch } from '@reduxjs/toolkit';

import { openModal, preserveModal } from '@suite/modal';
import { recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { type ConnectInitHooks } from '@suite-common/suite-types';
import { DEVICE, UI_REQUEST } from '@trezor/connect';

import { bluetoothOnDeviceConnectedThunk } from '../actions/bluetooth/bluetoothOnDeviceConnectedThunk';
import { markDeviceAsRecentlyConnectedThunk } from '../actions/wallet/markDeviceAsRecentlyConnectedThunk';

type ConnectInitHooksDeps = {
    dispatch: Dispatch;
    getState: () => any;
};

export const createConnectInitHooks = ({
    dispatch,
    getState,
}: ConnectInitHooksDeps): ConnectInitHooks => ({
    deviceEvent: {
        [DEVICE.CONNECT]: device => {
            dispatch(markDeviceAsRecentlyConnectedThunk(device));
            dispatch(bluetoothOnDeviceConnectedThunk(device));
        },
        [DEVICE.CONNECT_UNACQUIRED]: device => {
            dispatch(markDeviceAsRecentlyConnectedThunk(device));
        },
    },
    uiEvent: {
        [UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED]: () => {
            dispatch(openModal({ type: UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED }));
            dispatch(preserveModal());
        },
        [UI_REQUEST.REQUEST_WORD]: () => {
            if (selectRecoveryStatus(getState()) === 'waiting-for-confirmation') {
                // Since the device asked for a first word, we can safely assume we've received confirmation from the user
                dispatch(recoveryActions.setStatus('in-progress'));
            }
        },
    },
});
