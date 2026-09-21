import { type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { getBluetoothServiceInternal } from './bluetoothService';

export const prepareBluetoothMiddleware = createMiddlewareWithExtraDeps<void, UnknownAction, void>(
    (action, { next }) => {
        const result = next(action);

        if (
            bluetoothActions.adapterEventAction.match(action) ||
            bluetoothActions.knownDevicesUpdateAction.match(action) ||
            bluetoothActions.deviceUpdateAction.match(action) ||
            bluetoothActions.updateDeviceConnectionStatus.match(action) ||
            deviceActions.deviceDisconnect.match(action)
        ) {
            getBluetoothServiceInternal('backgroundScan').restartIfNeeded();
        }

        return result;
    },
);
