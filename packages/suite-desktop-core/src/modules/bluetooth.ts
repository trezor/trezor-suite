/**
 * Uses @trezor/transport-bluetooth package in nodejs context
 */
import { ipcMain } from 'electron';

import { getFreePort } from '@trezor/node-utils';
import { TrezorBle, BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

import type { Module } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: Module = ({ mainWindowProxy }) => {
    ipcMain.on('bluetooth/request-device', async () => {
        const emitSelect = ({ devices }: { devices: BluetoothDevice[] }) => {
            mainWindowProxy.getInstance()?.webContents.send(
                'bluetooth/select-device-event',
                devices.map(d => ({ uuid: d.address, name: d.name })),
            );
        };

        emitSelect({ devices: [] });

        const api = new TrezorBle({});
        // TODO: here race condition with bluetooth/select-device response?
        await api.connect();
        const info = await api.sendMessage('get_info');

        console.warn('Api info', info);

        // emit adapter event
        if (!info.powered) {
            mainWindowProxy.getInstance()?.webContents.send('bluetooth/adapter-event', false);
        }

        api.on('DeviceDiscovered', emitSelect);
        api.on('DeviceConnected', emitSelect);
        api.on('DeviceDisconnected', emitSelect);
        api.on('AdapterStateChanged', ({ powered }) => {
            console.warn('--->AdapterStateChanged in bluetooth module', powered);
            mainWindowProxy.getInstance()?.webContents.send('bluetooth/adapter-event', powered);
            if (!powered) {
                // api.sendMessage('stop_scan');
            } else {
                api.sendMessage('start_scan');
            }
        });
        api.on('DeviceConnecting', event => {
            console.warn('====> DeviceConnectingEvent', event);

            mainWindowProxy
                .getInstance()
                ?.webContents.send('bluetooth/connect-device-event', event);
        });

        await api.sendMessage('start_scan');

        emitSelect({ devices: api.getDevices() });

        const clear = () => {
            console.warn('CLEARRRRRR');
            ipcMain.removeAllListeners('bluetooth/select-device');
            api.removeAllListeners();
            // await api.sendMessage('stop_scan');
            api.disconnect();
        };

        ipcMain.on('bluetooth/select-device', async (_, deviceId) => {
            console.warn('SELECT-DEVICE', deviceId);
            if (!deviceId) {
                clear();

                return;
            }

            const connected = await api.sendMessage('connect_device', deviceId);
            if (connected !== true) {
                mainWindowProxy
                    .getInstance()
                    ?.webContents.send('bluetooth/connect-device-event', { phase: 'error' });
            } else {
                clear();
            }
        });
    });

    let bluetoothProcess: BluetoothProcess | undefined;

    const getBluetoothProcess = async () => {
        if (!bluetoothProcess) {
            const port = await getFreePort();
            bluetoothProcess = new BluetoothProcess(port);
        }

        return bluetoothProcess;
    };

    const killBluetoothProcess = () => {
        if (bluetoothProcess) {
            bluetoothProcess.stop();
            bluetoothProcess = undefined;
        }
    };

    const onLoad = async () => {
        const btProcess = await getBluetoothProcess();
        await btProcess.start();
    };

    const onQuit = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        killBluetoothProcess();
    };

    return { onLoad, onQuit };
};
