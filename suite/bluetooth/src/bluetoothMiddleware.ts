import { type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { getBluetoothServiceInternal } from './bluetoothService';

export const prepareBluetoothMiddleware = createMiddlewareWithExtraDeps<void, UnknownAction, void>(
    (action, { next }) => {
        if (
            isUiEventOfType(action, UI_EVENTS.FIRMWARE_DISCONNECT) &&
            action.payload.device.descriptor.apiType === 'bluetooth' &&
            action.payload.device.descriptor.id
        ) {
            const { id } = action.payload.device.descriptor;
            bluetoothIpc
                .disconnectDevice(id)
                .then(() => bluetoothIpc.startScan()) // restart scanning
                .catch(() => {});
        }

        if (
            bluetoothActions.adapterEventAction.match(action) ||
            bluetoothActions.knownDevicesUpdateAction.match(action) ||
            bluetoothActions.deviceUpdateAction.match(action) ||
            bluetoothActions.updateDeviceConnectionStatus.match(action) ||
            deviceActions.deviceDisconnect.match(action)
        ) {
            getBluetoothServiceInternal('backgroundScan').restartIfNeeded();
        }

        return next(action);
    },
);
