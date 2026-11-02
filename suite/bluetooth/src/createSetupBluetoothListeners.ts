import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { bluetoothActions } from '@suite-common/bluetooth';
import { type WithServices } from '@trezor/redux-utils';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice, fromBluetoothDevice } from './DesktopBluetoothDevice';
import { bluetoothAdapterEventThunk } from './bluetoothAdapterEventThunk';
import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothDep } from './createBluetooth';
import type { OpenSystemSettings } from './createOpenSystemSettings';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { remapKnownDevices } from './remapKnownDevices';

type SetupBluetoothListenersThunkDispatch = ThunkDispatch<
    unknown,
    WithServices<BluetoothDep>,
    UnknownAction
>;

type SetupBluetoothListenersDeps = {
    getKnownDevices: () => DesktopBluetoothDevice[];
    dispatch: SetupBluetoothListenersThunkDispatch;
    backgroundScan: BackgroundScan;
    openSystemSettings: OpenSystemSettings;
};

type SetupBluetoothListeners = () => void;

export const createSetupBluetoothListeners =
    (deps: SetupBluetoothListenersDeps): SetupBluetoothListeners =>
    () => {
        bluetoothIpc.on('adapter-event', status => {
            // TODO: check if redux.status != status && status == enabled
            // and fetch bluetoothIpc.getInfo() again
            deps.dispatch(bluetoothAdapterEventThunk({ status }));
        });

        bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
            const { knownDevices, nearbyDevices } = remapKnownDevices({
                knownDevices: deps.getKnownDevices(),
                nearbyDevices: nearbyDevicesIpc.map(fromBluetoothDevice),
            });

            deps.dispatch(
                bluetoothActions.knownDevicesUpdateAction({
                    knownDevices,
                }),
            );

            deps.backgroundScan.restartIfNeeded();

            deps.dispatch(
                bluetoothActions.nearbyDevicesUpdateAction({
                    nearbyDevices,
                }),
            );
        });

        bluetoothIpc.on('device-update', (deviceIpc: BluetoothDevice) => {
            let device = fromBluetoothDevice(deviceIpc);

            const knownDevice = deps.getKnownDevices().find(d => d.id === device.id);
            device = fixLinuxManufacturerData(device, knownDevice);

            deps.dispatch(bluetoothActions.deviceUpdateAction({ device }));
            deps.backgroundScan.restartIfNeeded();
        });

        bluetoothIpc.on('open-bluetooth-settings', async ({ id }) => {
            const settingsOpened = await deps.openSystemSettings('bluetooth');
            if (!settingsOpened.success) {
                // stop here and disconnect the device (abort pairing before it starts)
                // this should throw BluetoothSettingsMissing error in current connection process
                // device needs to be paired manually via system settings
                bluetoothIpc.disconnectDevice(id);
            }
        });
    };
