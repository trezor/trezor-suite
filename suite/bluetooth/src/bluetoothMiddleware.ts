import { type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { type WithServices, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { type BluetoothDep } from './createBluetooth';

export type PrepareBluetoothMiddlewareDeps = WithServices<BluetoothDep>;

export const prepareBluetoothMiddleware = createMiddlewareWithExtraDeps<
    PrepareBluetoothMiddlewareDeps,
    UnknownAction,
    void
>((action, { extra, next }) => {
    const result = next(action);

    if (
        bluetoothActions.adapterEventAction.match(action) ||
        bluetoothActions.knownDevicesUpdateAction.match(action) ||
        bluetoothActions.deviceUpdateAction.match(action) ||
        bluetoothActions.updateDeviceConnectionStatus.match(action) ||
        deviceActions.deviceDisconnect.match(action)
    ) {
        extra.services.bluetooth.restartBackgroundScanIfNeeded();
    }

    return result;
});
