import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopApiDep } from '@suite/desktop-app-api';
import {
    bluetoothActions,
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { type FirmwareRootState, selectFirmware } from '@suite-common/firmware';
import { type WithServices } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import { type DesktopBluetoothDevice, fromBluetoothDevice } from './DesktopBluetoothDevice';
import { type BackgroundScanDep } from './bluetoothBackgroundScan';
import { bluetoothConnectDeviceThunk } from './bluetoothConnectDeviceThunk';
import { type WithBluetoothRootState } from './desktopBluetoothReducer';
import { selectConnectingDevices } from './desktopBluetoothSelectors';
import { fixLinuxManufacturerData } from './fixLinuxManufacturerData';
import { openSystemSettingsThunk } from './openSystemSettingsThunk';
import { remapKnownDevices } from './remapKnownDevices';

export type BluetoothInitRootState = WithBluetoothRootState & DeviceRootState & FirmwareRootState;

export type BluetoothInitDispatch = ThunkDispatch<
    BluetoothInitRootState,
    WithServices<DesktopApiDep<'openSystemSettings' | 'appFocus'>>,
    UnknownAction
>;

export type BluetoothInitDeps = {
    getState: () => BluetoothInitRootState;
    dispatch: BluetoothInitDispatch;
} & BackgroundScanDep;

export type BluetoothInit = () => Promise<void>;

export type BluetoothInitDep = {
    bluetoothInit: BluetoothInit;
};

const attemptDeviceConnect = async (deps: BluetoothInitDeps, device: DesktopBluetoothDevice) => {
    const { getState, dispatch } = deps;
    const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
        d => d.id === device.id,
    );
    const connectingDevices = selectConnectingDevices(getState());
    const adapterStatus = selectAdapterStatus(getState());
    const suiteDevices = selectDevices(getState());
    const firmwareStatus = selectFirmware(getState());

    if (adapterStatus === 'power-suspending') {
        // system is going to sleep
        return;
    }

    if (!knownDevice || connectingDevices.includes(knownDevice.id)) {
        return;
    }

    const isFwUpdateProcess = firmwareStatus.status !== 'initial';
    if (isFwUpdateProcess) {
        // if FW update is in progress, only connect if it's the same device
        if (firmwareStatus.cachedDevice?.descriptor.id !== device.id) {
            return;
        }
    } else {
        // wait to acquire existing devices before connecting to the new one
        const hasUnacquiredDevice = suiteDevices.some(d => d.type === 'unacquired');
        // prioritize USB if already connected
        const hasSameUsbDevice = suiteDevices.some(
            d => d.id === knownDevice.deviceId && d.descriptor.apiType === 'usb' && d.connected,
        );

        if (hasUnacquiredDevice || hasSameUsbDevice) {
            return;
        }
    }

    // do not hijack BT connection
    const autoConnectPolicy = selectAutoConnectPolicy(getState());
    const devicePolicy = autoConnectPolicy[knownDevice.id];
    const isConnectable =
        device.connectionStatus.type === 'disconnected' &&
        devicePolicy?.type !== 'autoconnect-disabled' &&
        !device.manufacturerData.filterPolicy?.pairing;

    // NOTE
    // linux is caching manufacturerData
    // they will be always received as device is in pairing mode even if it not (until adapter reconnection)
    // manufacturerData are updates are sent properly only if there are 2 apps paired with one trezor and both are enabled (desktop + mobile)
    // TODO: in case of complains regarding auto reconnection on linux enable timeout based on recent disconnection timestamp
    // if (
    //     devicePolicy?.type === 'recently-disconnected' &&
    //     knownDevice.manufacturerData.filterPolicy?.pairing &&
    //     Date.now() - devicePolicy.timestamp < 10000
    // ) {
    //     isConnectable = false;
    // }

    if (isConnectable) {
        await dispatch(bluetoothConnectDeviceThunk({ deviceId: device.id }));
    }
};

const setupAutoReconnect = (deps: BluetoothInitDeps) => {
    const { getState } = deps;
    // Wait for 3 seconds or earlier if a connected device is detected.
    // The delay shouldn't be too perceptible, since other things are also loading at app start.
    // If user connects a device via USB, we don't start the BT connection,
    // this avoids clashes where both USB and BT try to connect at the same time.
    const waitForDevice = new Promise<void>(resolve => {
        const cleanup = () => {
            TrezorConnect.off('device-connect', cleanup);
            resolve();
        };
        TrezorConnect.on('device-connect', cleanup);
        resolveAfter(3000).then(cleanup);
    });

    return waitForDevice.then(() => {
        // Start attempting to connect to known BT devices
        bluetoothIpc.on('device-update', async (deviceIpc: BluetoothDevice) => {
            const device = fromBluetoothDevice(deviceIpc);
            await attemptDeviceConnect(deps, device);
        });

        // If we already have some paired devices, we assume user will have a BT device,
        // and therefore we start looking for it.
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        if (knownDevices.length > 0) {
            deps.backgroundScan.start();
        }
    });
};

const setupListeners = (deps: BluetoothInitDeps) => {
    const { getState, dispatch } = deps;

    bluetoothIpc.on('adapter-event', status => {
        // TODO: check if redux.status != status && status == enabled
        // and fetch bluetoothIpc.getInfo() again
        dispatch(bluetoothActions.adapterEventAction({ status }));
    });

    bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
        const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);

        const remappedKnownDevices = remapKnownDevices({
            knownDevices: selectKnownDevices<DesktopBluetoothDevice>(getState()),
            nearbyDevices,
        });

        dispatch(
            bluetoothActions.knownDevicesUpdateAction({
                knownDevices: remappedKnownDevices,
            }),
        );
        dispatch(
            bluetoothActions.nearbyDevicesUpdateAction({
                nearbyDevices,
            }),
        );
    });

    bluetoothIpc.on('device-update', (deviceIpc: BluetoothDevice) => {
        let device = fromBluetoothDevice(deviceIpc);

        const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
            d => d.id === device.id,
        );
        device = fixLinuxManufacturerData(device, knownDevice);

        dispatch(bluetoothActions.deviceUpdateAction({ device }));
    });

    bluetoothIpc.on('open-bluetooth-settings', async ({ id }) => {
        const settingsOpened = await dispatch(
            openSystemSettingsThunk({ type: 'bluetooth' }),
        ).unwrap();
        if (!settingsOpened.success) {
            // stop here and disconnect the device (abort pairing before it starts)
            // this should throw BluetoothSettingsMissing error in current connection process
            // device needs to be paired manually via system settings
            bluetoothIpc.disconnectDevice(id);
        }
    });
};

const init = async (deps: BluetoothInitDeps) => {
    const { getState, dispatch } = deps;

    const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
    const result = await bluetoothIpc.init({
        knownDevices,
    });

    if (!result.success) {
        dispatch(
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
        dispatch(
            bluetoothActions.adapterEventAction({
                status: apiInfo.payload.state,
            }),
        );
    }

    setupListeners(deps);

    setupAutoReconnect(deps);
};

export const createBluetoothInit = (deps: BluetoothInitDeps): BluetoothInit => {
    let inited = false;

    return () => {
        if (inited) {
            return Promise.resolve();
        }
        inited = true;

        return init(deps);
    };
};
