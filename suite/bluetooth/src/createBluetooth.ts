import { type BluetoothInit, type BluetoothInitDep } from './createBluetoothInit';

export type BluetoothDeps = BluetoothInitDep;

export type Bluetooth = {
    init: BluetoothInit;
};

export type BluetoothDep = {
    bluetooth: Bluetooth;
};

export const createBluetooth = (deps: BluetoothDeps): Bluetooth => {
    let inited = false;

    return {
        init: () => {
            if (inited) {
                return Promise.resolve();
            }
            inited = true;

            return deps.bluetoothInit();
        },
    };
};
