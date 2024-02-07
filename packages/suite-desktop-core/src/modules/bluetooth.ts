/**
 * Uses @trezor/transport-bluetooth package in nodejs context
 */

import { app, ipcMain } from 'electron';
import { getFreePort } from '@trezor/node-utils';
// import { TrezorBleApi } from '@trezor/transport-bluetooth';

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
