import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopDeviceRootState } from '@suite/device';
import { bluetoothActions, selectKnownDevices } from '@suite-common/bluetooth';
import { type WithServices } from '@suite-common/redux-utils';

import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';
import { type BackgroundScan } from './bluetoothBackgroundScan';
import { bluetoothDisconnectDeviceThunk } from './bluetoothDisconnectDeviceThunk';
import { type BluetoothDep } from './createBluetooth';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { isBluetoothDeviceReachable } from './isBluetoothDeviceReachable';

type SuspendHandlerRootState = WithBluetoothRootState & DesktopDeviceRootState;

type SuspendHandlerThunkDispatch = ThunkDispatch<
    SuspendHandlerRootState,
    WithServices<BluetoothDep>,
    UnknownAction
>;

type SuspendHandlerDeps = {
    getState: () => SuspendHandlerRootState;
    dispatch: SuspendHandlerThunkDispatch;
    backgroundScan: BackgroundScan;
};

type SuspendHandler = () => void;

export const createSuspendHandler =
    (deps: SuspendHandlerDeps): SuspendHandler =>
    () => {
        deps.dispatch(bluetoothActions.adapterEventAction({ status: 'power-suspending' }));

        deps.backgroundScan.stop();

        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(deps.getState());
        knownDevices.forEach(device => {
            if (isBluetoothDeviceReachable(device))
                deps.dispatch(bluetoothDisconnectDeviceThunk({ id: device.id }));
        });
    };
