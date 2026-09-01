import { openModal, preserveModal } from '@suite/modal';
import { recoveryActions, selectRecoveryStatus } from '@suite/recovery';
import { type Dispatch } from '@suite-common/redux-utils';
import { type ConnectInitHooks } from '@suite-common/suite-types';
import { DEVICE, UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import { bluetoothOnDeviceConnectedThunk } from '../actions/bluetooth/bluetoothOnDeviceConnectedThunk';
import { markDeviceAsRecentlyConnectedThunk } from '../actions/wallet/markDeviceAsRecentlyConnectedThunk';

type ConnectInitHooksDeps = {
    dispatch: Dispatch;
    getState: () => any;
};

export const createConnectInitHooks = (deps: ConnectInitHooksDeps): ConnectInitHooks => ({
    deviceEvent: {
        [DEVICE.CONNECT]: device => {
            deps.dispatch(markDeviceAsRecentlyConnectedThunk(device));
            deps.dispatch(bluetoothOnDeviceConnectedThunk(device));
        },
        [DEVICE.CONNECT_UNACQUIRED]: device => {
            deps.dispatch(markDeviceAsRecentlyConnectedThunk(device));
        },
    },
    uiEvent: {
        [UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED]: () => {
            deps.dispatch(openModal({ type: UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED }));
            deps.dispatch(preserveModal());
        },
        [UI_REQUESTS.REQUEST_WORD]: () => {
            if (selectRecoveryStatus(deps.getState()) === 'waiting-for-confirmation') {
                // Since the device asked for a first word, we can safely assume we've received confirmation from the user
                deps.dispatch(recoveryActions.setStatus('in-progress'));
            }
        },
    },
});
