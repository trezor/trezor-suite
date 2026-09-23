import { type Middleware, type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { type BackgroundScanDep } from './bluetoothBackgroundScan';

export type PrepareBluetoothMiddlewareDeps = BackgroundScanDep;

export type BluetoothMiddlewareDep = {
    bluetoothMiddleware: Middleware;
};

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
        extra.backgroundScan.restartIfNeeded();
    }

    return result;
});
