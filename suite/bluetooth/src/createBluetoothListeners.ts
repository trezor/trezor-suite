import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import { bluetoothActions } from '@suite-common/bluetooth';
import { type WithServices } from '@suite-common/redux-utils';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';

import { type DesktopBluetoothDevice, fromBluetoothDevice } from './DesktopBluetoothDevice';
import { bluetoothAdapterEventThunk } from './bluetoothAdapterEventThunk';
import { type BackgroundScan } from './bluetoothBackgroundScan';
import { type BluetoothDep } from './createBluetooth';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { openSystemSettingsThunk } from './openSystemSettingsThunk';
import { remapKnownDevices } from './remapKnownDevices';

type BluetoothListenersThunkDispatch = ThunkDispatch<
    unknown,
    WithServices<DesktopApiDep<'openSystemSettings'> & BluetoothDep>,
    UnknownAction
>;

type BluetoothListenersDeps = {
    getKnownDevices: () => DesktopBluetoothDevice[];
    dispatch: BluetoothListenersThunkDispatch;
    backgroundScan: BackgroundScan;
};

type BluetoothListeners = () => void;

export const createBluetoothListeners =
    (deps: BluetoothListenersDeps): BluetoothListeners =>
    () => {
        bluetoothIpc.on('adapter-event', status => {
            // TODO: check if redux.status != status && status == enabled
            // and fetch bluetoothIpc.getInfo() again
            deps.dispatch(bluetoothAdapterEventThunk({ status }));
        });

        bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
            const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);

            const remappedKnownDevices = remapKnownDevices({
                knownDevices: deps.getKnownDevices(),
                nearbyDevices,
            });

            deps.dispatch(
                bluetoothActions.knownDevicesUpdateAction({
                    knownDevices: remappedKnownDevices,
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
            const settingsOpened = await deps
                .dispatch(openSystemSettingsThunk({ type: 'bluetooth' }))
                .unwrap();
            if (!settingsOpened.success) {
                // stop here and disconnect the device (abort pairing before it starts)
                // this should throw BluetoothSettingsMissing error in current connection process
                // device needs to be paired manually via system settings
                bluetoothIpc.disconnectDevice(id);
            }
        });
    };
