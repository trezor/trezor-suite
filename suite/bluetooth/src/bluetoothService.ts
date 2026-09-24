import {
    selectAdapterStatus,
    selectAutoConnectPolicy,
    selectKnownDevices,
} from '@suite-common/bluetooth';
import { selectDevices } from '@suite-common/device';
import { selectFirmware } from '@suite-common/firmware';
import TrezorConnect from '@trezor/connect';
import { type BluetoothDevice, bluetoothIpc } from '@trezor/transport-bluetooth';
import { resolveAfter } from '@trezor/utils';

import { type DesktopBluetoothDevice, fromBluetoothDevice } from './DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from './bluetoothConnectDeviceThunk';
import {
    type BluetoothService,
    type BluetoothServiceDeps,
    type BluetoothServiceInternalDeps,
} from './bluetoothServiceTypes';
import { selectConnectingDevices } from './desktopBluetoothSelectors';

const attemptDeviceConnect = async (deps: BluetoothServiceDeps, device: DesktopBluetoothDevice) => {
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

const setupAutoReconnect = (
    deps: BluetoothServiceDeps,
    { backgroundScan }: BluetoothServiceInternalDeps,
) => {
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

        TrezorConnect.on('device-disconnect', device => {
            if (device.descriptor.apiType === 'bluetooth') {
                // wait for deviceActions.deviceDisconnect to update redux state
                queueMicrotask(() => {
                    backgroundScan.restartIfNeeded();
                });
            }
        });

        // If we already have some paired devices, we assume user will have a BT device,
        // and therefore we start looking for it.
        const knownDevices = selectKnownDevices<DesktopBluetoothDevice>(getState());
        if (knownDevices.length > 0) {
            backgroundScan.start();
        }
    });
};

export const createBluetoothService = (
    deps: BluetoothServiceDeps,
    internalDeps: BluetoothServiceInternalDeps,
): BluetoothService => {
    let inited = false;

    return {
        init: () => {
            if (inited) {
                return Promise.resolve();
            }
            inited = true;

            return setupAutoReconnect(deps, internalDeps);
        },
        restartBackgroundScan: () => {
            internalDeps.backgroundScan.restartIfNeeded();
        },
    };
};
