/// <reference types="web-bluetooth" />

import { useEffect } from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import { WebBluetoothApi } from '@trezor/transport/lib/api/webbluetooth';
import { desktopApi } from '@trezor/suite-desktop-api';

import { BluetoothSelectDevice } from './Bluetooth/BluetoothSelectDevice';
import { BluetoothPairDevice } from './Bluetooth/BluetoothPairDevice';

// https://www.electronjs.org/docs/latest/tutorial/devices#example

export const Bluetooth = () => {
    useEffect(() => {
        const statusHandler = () => {
            navigator.bluetooth
                .getAvailability()
                .then(status => console.warn('BT Avialable', status));
        };

        navigator.bluetooth.addEventListener('onavailabilitychanged', statusHandler);

        statusHandler();

        return () => {
            navigator.bluetooth.removeEventListener('onavailabilitychanged', statusHandler, false);
        };
    }, []);

    desktopApi.on('bluetooth/handshake', a => {
        console.warn('bluetooth/handshake', a);
    });

    desktopApi.on('bluetooth/pairing-start', async () => {
        try {
            await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('---pairing error', error);
        }
    });

    // TODO init only after handshake
    const API = new WebBluetoothApi({});

    console.warn('================== INIT BLE INTERFACE');

    desktopApi.on('bluetooth/api-request', async request => {
        console.warn('BT api request in renderer', request);
        // @ts-expect-error TODO types
        const apiMethod = API[request.method] as (...args: any[]) => Promise<any>;
        if (typeof apiMethod === 'function') {
            const result = await apiMethod.call(API, ...request.args);
            console.warn('Method result', result);
            desktopApi.bluetoothApiResponse({
                messageId: request.messageId,
                ...result,
            });
        } else if (request.method === 'listen') {
            const result = await API.enumerate();
            console.warn('Listen result', result);
            desktopApi.bluetoothApiResponse({
                messageId: request.messageId,
                success: true,
                payload: result.payload.map((path: any) => ({ path })),
            });
        } else {
            desktopApi.bluetoothApiResponse({
                messageId: request.messageId,
                success: false,
                payload: [],
            });
        }
    });

    // desktopApi.on('bluetooth/listen', a => {
    //     console.warn('BT api listent request', a);
    // });

    // desktopApi.on('bluetooth/open-request', () => {});
    // desktopApi.on('bluetooth/close-request', () => {});
    // desktopApi.on('bluetooth/write-request', () => {});
    // desktopApi.on('bluetooth/read-request', () => {});

    // create ipc-proxy for bluetooth

    return (
        <div>
            <BluetoothSelectDevice />
            <BluetoothPairDevice />
        </div>
    );
    // return null;
};
