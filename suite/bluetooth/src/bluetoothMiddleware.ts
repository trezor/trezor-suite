import { type UnknownAction } from '@reduxjs/toolkit';

import { type WithServices, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BluetoothDep } from './bluetoothServiceTypes';

export type PrepareBluetoothMiddlewareDeps = WithServices<BluetoothDep>;

export const prepareBluetoothMiddleware = createMiddlewareWithExtraDeps<
    PrepareBluetoothMiddlewareDeps,
    UnknownAction,
    void
>((action, { next }) => {
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

    return next(action);
});
