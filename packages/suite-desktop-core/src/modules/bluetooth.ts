/**
 * Uses @trezor/transport-bluetooth package in nodejs context
 */

import { app, ipcMain } from 'electron';
import { getFreePort } from '@trezor/node-utils';
import { TrezorBleApi, BluetoothDevice } from '@trezor/transport-bluetooth';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';
import type { Module } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: Module = ({ mainWindow }) => {
    // const { logger } = global;

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

    ipcMain.on('bluetooth/request-device', async () => {
        const emitSelect = ({ devices }: { devices: BluetoothDevice[] }) => {
            mainWindow.webContents.send(
                'bluetooth/select-device-event',
                devices.map(d => ({ uuid: d.address, name: d.name })),
            );
        };

        emitSelect({ devices: [] });

        const api = new TrezorBleApi({});
        // TODO: here race condition with bluetooth/select-device response?
        await api.connect();
        const info = await api.sendMessage('get_info');

        console.warn('Api info', info);

        // emit adapter event
        if (!info.powered) {
            mainWindow.webContents.send('bluetooth/adapter-event', false);
        }

        api.on('DeviceDiscovered', emitSelect);
        api.on('DeviceConnected', emitSelect);
        api.on('DeviceDisconnected', emitSelect);
        api.on('AdapterStateChanged', ({ powered }) => {
            console.warn('--->AdapterStateChanged', powered);
            mainWindow.webContents.send('bluetooth/adapter-event', powered);
            if (!powered) {
                // api.sendMessage('stop_scan');
            } else {
                api.sendMessage('start_scan');
            }
        });
        api.on('DeviceConnecting', event => {
            console.warn('====> DeviceConnectingEvent', event);

            mainWindow.webContents.send('bluetooth/connect-device-event', event);
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
                mainWindow.webContents.send('bluetooth/connect-device-event', { phase: 'error' });
            } else {
                clear();
            }
        });
    });

    const registerModule = async () => {
        const pr = await getBluetoothProcess();
        await pr.start();

        // const ws = new TrezorBleApi({});
        // ws.on('transport-interface-change', (event: any) => {
        //     console.warn('transport-interface-change', event);
        // });
        // await ws.connect();
        // await ws.startScanning();
        // const dev = await ws.connectDevice('hci0/dev_F2_CF_49_B0_5D_AF');
        // console.warn('conn', succ, dev);
    };

    const dispose = () => {
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        killBluetoothProcess();
    };

    app.on('before-quit', dispose);
    mainWindow.webContents.on('did-start-loading', dispose);
    ipcMain.once('app/restart', dispose);

    return registerModule;
};
