/**
 * Uses @trezor/transport-bluetooth package in nodejs context
 */

import { getFreePort } from '@trezor/node-utils';

import { BluetoothProcess } from '../libs/processes/BluetoothProcess';

import type { Module } from './index';

export const SERVICE_NAME = '@trezor/transport-bluetooth';

export const init: Module = () => {
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
