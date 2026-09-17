import { type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { deviceActions } from '@suite-common/device';
import { firmwareActions, firmwareUpdateThunk } from '@suite-common/firmware';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';

import { getBluetoothServiceInternal } from './bluetoothService';

export const prepareBluetoothMiddleware = createMiddlewareWithExtraDeps<void, UnknownAction, void>(
    (action, { next }) => {
        if (
            isUiEventOfType(action, UI_EVENTS.FIRMWARE_DISCONNECT) &&
            action.payload.device.descriptor.apiType === 'bluetooth' &&
            action.payload.device.descriptor.id
        ) {
            const { id } = action.payload.device.descriptor;
            getBluetoothServiceInternal('firmwareUpdateScan').start(id);
        }

        const result = next(action);

        if (
            bluetoothActions.knownDevicesUpdateAction.match(action) ||
            bluetoothActions.deviceUpdateAction.match(action) ||
            bluetoothActions.updateDeviceConnectionStatus.match(action) ||
            deviceActions.deviceDisconnect.match(action)
        ) {
            getBluetoothServiceInternal('backgroundScan').restartIfNeeded();
        }

        if (
            firmwareActions.resetReducer.match(action) ||
            (firmwareActions.setStatus.match(action) &&
                action.payload !== 'started' &&
                action.payload !== 'thp-pairing') ||
            (firmwareActions.setFirmwareUpdateError.match(action) && action.payload) ||
            firmwareUpdateThunk.rejected.match(action) ||
            firmwareUpdateThunk.fulfilled.match(action)
        ) {
            getBluetoothServiceInternal('firmwareUpdateScan').stop();
        }

        return result;
    },
);
