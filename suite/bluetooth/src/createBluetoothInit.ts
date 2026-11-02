import type { Dispatch } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

type BluetoothInitDeps = {
    getKnownDevices: () => DesktopBluetoothDevice[];
    dispatch: Dispatch;
    setupBluetoothListeners: () => void;
    setupBluetoothAutoReconnect: () => Promise<void>;
};

type BluetoothInit = () => Promise<void>;

export const createBluetoothInit = (deps: BluetoothInitDeps): BluetoothInit => {
    let inited = false;

    return async () => {
        if (inited) {
            return Promise.resolve();
        }
        inited = true;

        const knownDevices = deps
            .getKnownDevices()
            .map(device => ({ id: device.id, macAddress: device.macAddress }));
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
        deps.setupBluetoothListeners();

        // NOTE: do not await setupAutoReconnect to avoid blocking the initialization process
        void deps.setupBluetoothAutoReconnect();
    };
};
