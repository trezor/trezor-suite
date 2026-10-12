import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type BackgroundScan } from './bluetoothBackgroundScan';
import type { WithBluetoothRootState } from './desktopBluetoothReducer';

type BluetoothInitRootState = WithBluetoothRootState;

type BluetoothInitThunkDispatch = ThunkDispatch<BluetoothInitRootState, unknown, UnknownAction>;

type BluetoothInitDeps = {
    getState: () => BluetoothInitRootState;
    dispatch: BluetoothInitThunkDispatch;
    backgroundScan: BackgroundScan;
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

        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(deps.getState());
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
