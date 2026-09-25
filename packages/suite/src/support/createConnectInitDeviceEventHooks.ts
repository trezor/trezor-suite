import { bluetoothOnDeviceConnectedThunk } from '@suite/bluetooth';
import { type Dispatch } from '@suite-common/redux-utils';
import { type ConnectInitDeviceEventHooks } from '@suite-common/suite-types';
import { DEVICE } from '@trezor/connect';

import { markDeviceAsRecentlyConnectedThunk } from '../actions/wallet/markDeviceAsRecentlyConnectedThunk';

type ConnectInitDeviceEventHooksDeps = {
    dispatch: Dispatch;
};

export const createConnectInitDeviceEventHooks = (
    deps: ConnectInitDeviceEventHooksDeps,
): ConnectInitDeviceEventHooks => ({
    [DEVICE.CONNECT]: device => {
        deps.dispatch(markDeviceAsRecentlyConnectedThunk(device));
        deps.dispatch(bluetoothOnDeviceConnectedThunk(device));
    },
    [DEVICE.CONNECT_UNACQUIRED]: device => {
        deps.dispatch(markDeviceAsRecentlyConnectedThunk(device));
    },
});
