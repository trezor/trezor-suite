import { type BluetoothService, bluetoothOnDeviceConnectedThunk } from '@suite/bluetooth';
import { type ConnectInitDeviceEventHooks } from '@suite-common/suite-types';
import { DEVICE } from '@trezor/connect';
import { type Dispatch } from '@trezor/redux-utils';

import { markDeviceAsRecentlyConnectedThunk } from '../actions/wallet/markDeviceAsRecentlyConnectedThunk';

type ConnectInitDeviceEventHooksDeps = {
    dispatch: Dispatch;
    bluetooth: BluetoothService;
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
    [DEVICE.DISCONNECT]: device => {
        if (device.descriptor.apiType === 'bluetooth') {
            deps.bluetooth.restartBackgroundScan();
        }
    },
});
