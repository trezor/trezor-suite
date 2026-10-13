import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

type BluetoothInitThunkDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

type BluetoothInitDeps = {
    getKnownDevices: () => DesktopBluetoothDevice[];
    dispatch: BluetoothInitThunkDispatch;
    setupListeners: () => void;
    setupAutoReconnect: () => void;
};

type BluetoothInit = () => Promise<void>;

export const createBluetoothInit = (deps: BluetoothInitDeps): BluetoothInit => {
    let inited = false;

    return async () => {
        if (inited) {
            return Promise.resolve();
        }
        inited = true;

        const knownDevices = deps.getKnownDevices();
        const result = await bluetoothIpc.init({
            knownDevices,
        });

        if (!result.success) {
            deps.dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Unable to initialize Bluetooth Module.',
                }),
            );

            return;
        }

        // NOTE: getInfo when adapter is disabled adapter may return different result in adapter_info field
        const apiInfo = await bluetoothIpc.getInfo();
        if (apiInfo.success) {
            deps.dispatch(
                bluetoothActions.adapterEventAction({
                    status: apiInfo.payload.state,
                }),
            );
        }

        // setup bluetoothIpc event listeners
        deps.setupListeners();

        // NOTE: do not await setupAutoReconnect to avoid blocking the initialization process
        deps.setupAutoReconnect();
    };
};
