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
import TrezorConnect, { UI_EVENTS, isUiEventOfType } from '@trezor/connect';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import {
    type DesktopBluetoothDevice,
    fromBluetoothDevice,
} from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothStartScanningThunk } from 'src/actions/bluetooth/bluetoothStartScanningThunk';
import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import { type AppState } from 'src/types/suite';

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
            dispatch(bluetoothStartScanningThunk());
        }
    });
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
                .then(() => bluetoothIpc.startScan()) // restart scanning
                .catch(() => {});
        }

        if (initBluetoothThunk.fulfilled.match(action)) {
            const { getState, dispatch } = api;
            setupAutoReconnect(getState, dispatch);
        }

        return next(action);
    };

export default bluetoothMiddleware;
