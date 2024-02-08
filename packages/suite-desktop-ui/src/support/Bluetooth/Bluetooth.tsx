import { useEffect } from 'react';

// import { desktopApi } from '@trezor/suite-desktop-api';

import { BluetoothSelectDevice } from './BluetoothSelectDevice';
import { BluetoothPairDevice } from './BluetoothPairDevice';

// https://www.electronjs.org/docs/latest/tutorial/devices#example

// navigator.bluetooth interface
const bluetooth = {
    getAvailability: () => Promise.resolve(true),
    addEventListener: (..._args: any[]) => {},
    removeEventListener: (..._args: any[]) => {},
};

export const Bluetooth = () => {
    useEffect(() => {
        const statusHandler = () => {
            bluetooth.getAvailability().then(status => console.warn('BT Avialable', status));
        };

        bluetooth.addEventListener('onavailabilitychanged', statusHandler);

        statusHandler();

        return () => {
            bluetooth.removeEventListener('onavailabilitychanged', statusHandler, false);
        };
    }, []);

    return (
        <>
            <BluetoothSelectDevice />
            <BluetoothPairDevice />
        </>
    );
};
