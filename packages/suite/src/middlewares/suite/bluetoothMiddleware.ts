import { type Dispatch as ReduxDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import { selectFirmware } from '@suite-common/firmware';
import { type Dispatch } from '@suite-common/redux-utils';
import TrezorConnect, { type Device, UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import {
    type DesktopBluetoothDevice,
    fromBluetoothDevice,
} from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import { isBluetoothDeviceReachable } from 'src/actions/bluetooth/isBluetoothDeviceReachable';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type AppState } from 'src/types/suite';

const BACKGROUND_SCAN_INTERVAL = 6_000;
const BACKGROUND_SCAN_DURATION = 2_000;

const createBackgroundScan = (getState: () => AppState) => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const getKnownDevices = () => selectKnownDevices<DesktopBluetoothDevice>(getState());

    const stop = () => {
        bluetoothIpc.stopScan('background');
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    };

    const runCycle = async () => {
        if (!selectIsWindowVisible(getState())) {
            return;
        }

        const knownDevices = getKnownDevices();
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
        const knownDevices = getKnownDevices();
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

const setupAutoReconnect = (getState: () => AppState, dispatch: Dispatch) => {
    const backgroundScan = createBackgroundScan(getState);
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

    waitForDevice.then(() => {
        // Start attempting to connect to known BT devices
        bluetoothIpc.on('device-update', async (deviceIpc: BluetoothDevice) => {
            const device = fromBluetoothDevice(deviceIpc);
            await attemptDeviceConnect(device, getState, dispatch);
        });

        // If we already have some paired devices, we assume user will have a BT device,
        // and therefore we start looking for it.
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        if (knownDevices.length > 0) {
            backgroundScan.start();
        }

        bluetoothIpc.on('device-update', () => {
            backgroundScan.restartIfNeeded();
        });
    });
};

const scanUntilReconnected = (id: string) => {
    const cleanup = (device: Device) => {
        if (device.descriptor.id === id) {
            bluetoothIpc.stopScan('firmware-update');
            TrezorConnect.off('device-connect', cleanup);
        }
    };

    bluetoothIpc.startScan('firmware-update');
    TrezorConnect.on('device-connect', cleanup);
};

const bluetoothMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        if (
            isUiEventOfType(action, UI_EVENTS.FIRMWARE_DISCONNECT) &&
            action.payload.device.descriptor.apiType === 'bluetooth' &&
            action.payload.device.descriptor.id
        ) {
            const { id } = action.payload.device.descriptor;
            bluetoothIpc
                .disconnectDevice(id)
                .then(() => scanUntilReconnected(id))
                .catch(() => {});
        }

        if (initBluetoothThunk.fulfilled.match(action)) {
            const { getState, dispatch } = api;
            setupAutoReconnect(getState, dispatch);
        }

        return next(action);
    };

export default bluetoothMiddleware;
