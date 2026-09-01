import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import {
    bluetoothActions,
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import { selectFirmware } from '@suite-common/firmware';
import TrezorConnect, { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { desktopApi } from '@trezor/suite-desktop-api';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import {
    type DesktopBluetoothDevice,
    fromBluetoothDevice,
} from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { fixLinuxManufacturerData } from 'src/actions/bluetooth/fixLinuxManufacturerData';
import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import { isBluetoothDeviceReachable } from 'src/actions/bluetooth/isBluetoothDeviceReachable';
import { remapKnownDevicesForLinuxAndWindows } from 'src/actions/bluetooth/remapKnownDevicesForLinuxAndWindows';
import { type AppState } from 'src/types/suite';

const BACKGROUND_SCAN_INTERVAL = 60_000;
const BACKGROUND_SCAN_DURATION = 15_000;

const createBackgroundScan = (getState: () => AppState) => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    };

    const runCycle = async () => {
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        const hasDisconnectedKnownDevice = knownDevices.some(d => !isBluetoothDeviceReachable(d));
        if (hasDisconnectedKnownDevice) {
            await bluetoothIpc.startScan('background');
            resolveAfter(BACKGROUND_SCAN_DURATION).then(() => bluetoothIpc.stopScan('background'));
        } else {
            stop();
        }
    };

    const start = () => {
        if (timerId !== null) {
            return;
        }
        runCycle();
        timerId = setInterval(runCycle, BACKGROUND_SCAN_INTERVAL);
    };

    const restartIfNeeded = () => {
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        if (knownDevices.some(d => !isBluetoothDeviceReachable(d))) {
            start();
        }
    };

    return { start, stop, restartIfNeeded };
};

const attemptDeviceConnect = async (
    device: DesktopBluetoothDevice,
    getState: () => AppState,
    dispatch: Dispatch,
) => {
    const knownDevice = selectKnownDevices<DesktopBluetoothDevice>(getState()).find(
        d => d.id === device.id,
    );
    const connectingDevices = selectConnectingDevices(getState());
    const adapterStatus = selectAdapterStatus(getState());
    const suiteDevices = selectDevices(getState());
    const firmwareStatus = selectFirmware(getState());

    if (adapterStatus === 'power-suspending') {
        return;
    }

    if (!knownDevice || connectingDevices.includes(knownDevice.id)) {
        return;
    }

    const isFwUpdateProcess = firmwareStatus.status !== 'initial';
    if (isFwUpdateProcess) {
        if (firmwareStatus.cachedDevice?.descriptor.id !== device.id) {
            return;
        }
    } else {
        const hasUnacquiredDevice = suiteDevices.some(d => d.type === 'unacquired');
        const hasSameUsbDevice = suiteDevices.some(
            d => d.id === knownDevice.deviceId && d.descriptor.apiType === 'usb' && d.connected,
        );

        if (hasUnacquiredDevice || hasSameUsbDevice) {
            return;
        }
    }

    const autoConnectPolicy = selectAutoConnectPolicy(getState());
    const devicePolicy = autoConnectPolicy[knownDevice.id];
    const isConnectable =
        device.connectionStatus.type === 'disconnected' &&
        devicePolicy?.type !== 'autoconnect-disabled' &&
        !device.manufacturerData.filterPolicy?.pairing;

    if (isConnectable) {
        await dispatch(bluetoothConnectDeviceThunk({ deviceId: device.id }));
    }
};

const setupBluetoothListeners = (getState: () => AppState, dispatch: Dispatch) => {
    bluetoothIpc.on('adapter-event', status => {
        dispatch(bluetoothActions.adapterEventAction({ status }));
    });

    bluetoothIpc.on('device-list-update', nearbyDevicesIpc => {
        const nearbyDevices = nearbyDevicesIpc.map(fromBluetoothDevice);
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());

        const remappedKnownDevices = remapKnownDevicesForLinuxAndWindows({
            knownDevices,
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
        const result = await desktopApi.openSystemSettings('bluetooth');
        if (!result.success) {
            bluetoothIpc.disconnectDevice(id);
        }
    });
};

const setupAutoReconnect = (getState: () => AppState, dispatch: Dispatch) => {
    const backgroundScan = createBackgroundScan(getState);

    // Wait for 3s or until a USB device connects before attempting BT auto-reconnect
    const waitForDevice = new Promise<void>(resolve => {
        const cleanup = () => {
            TrezorConnect.off('device-connect', cleanup);
            resolve();
        };
        TrezorConnect.on('device-connect', cleanup);
    });

    Promise.race([waitForDevice, resolveAfter(3000)]).then(() => {
        bluetoothIpc.on('device-update', async (deviceIpc: BluetoothDevice) => {
            const device = fromBluetoothDevice(deviceIpc);
            await attemptDeviceConnect(device, getState, dispatch);
        });

        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        if (knownDevices.length > 0) {
            backgroundScan.start();
        }

        bluetoothIpc.on('device-update', () => {
            backgroundScan.restartIfNeeded();
        });
    });
};

const bluetoothMiddleware =
    (api: MiddlewareAPI<Dispatch<UnknownAction>, AppState>) =>
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

        if (initBluetoothThunk.fulfilled.match(action)) {
            const { getState, dispatch } = api;

            setupBluetoothListeners(getState, dispatch);
            setupAutoReconnect(getState, dispatch);
        }

        return next(action);
    };

export default bluetoothMiddleware;
