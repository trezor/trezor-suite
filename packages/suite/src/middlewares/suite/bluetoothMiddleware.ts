import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type AppState } from 'src/types/suite';

const bluetoothMiddleware =
    (_api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
    (next: Dispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
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
    };

export default bluetoothMiddleware;
