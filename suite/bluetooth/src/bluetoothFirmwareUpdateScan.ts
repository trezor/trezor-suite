import TrezorConnect, { type Device } from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type FirmwareUpdateScan } from './bluetoothServiceTypes';

/**
 * BluetoothService internal dependency.
 */
const startFirmwareUpdateScan = (id: string) => {
    const abortController = new AbortController();
    let isScanning = false;

    const onDeviceConnect = (device: Device) => {
        if (device.descriptor.apiType === 'bluetooth' && device.descriptor.id === id) {
            abortController.abort();
        }
    };

    const onAbort = () => {
        TrezorConnect.off('device-connect', onDeviceConnect);
        if (isScanning) {
            bluetoothIpc.stopScan('firmware-update').catch(() => {});
        }
    };

    const stop = () => {
        abortController.abort();
        abortController.signal.removeEventListener('abort', onAbort);
    };

    abortController.signal.addEventListener('abort', onAbort, { once: true });

    TrezorConnect.on('device-connect', onDeviceConnect);

    bluetoothIpc
        .disconnectDevice(id)
        .then(result => {
            if (!result.success || abortController.signal.aborted) {
                return stop();
            }

            isScanning = true;

            return bluetoothIpc.startScan('firmware-update').then(scanResult => {
                if (!scanResult.success) {
                    stop();
                }
            });
        })
        .catch(() => {
            stop();
        });

    return stop;
};

export const createFirmwareUpdateScan = (): FirmwareUpdateScan => {
    let abortScan: ReturnType<typeof startFirmwareUpdateScan> | undefined;

    const stop = () => {
        abortScan?.();
        abortScan = undefined;
    };

    const start = (id: string) => {
        stop();
        abortScan = startFirmwareUpdateScan(id);
    };

    return { start, stop };
};
