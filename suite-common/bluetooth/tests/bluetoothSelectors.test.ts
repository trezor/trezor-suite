import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    type BluetoothManufacturerData,
    prepareInitialState,
    prepareSelectAllDevices,
} from '../src';
import type { WithBluetoothState } from '../src/bluetoothSelectors';
import type { BluetoothDeviceCommon } from '../src/types';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: undefined,
};

const pairingDeviceStateA: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('A'),
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'pairing' },
};

const disconnectedDeviceB: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('B'),
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

const pairingDeviceStateC: BluetoothDeviceCommon = {
    id: asBluetoothDeviceId('C'),
    manufacturerData,
    name: 'Trezor C',
    lastUpdatedTimestamp: 3,
    connectionStatus: { type: 'pairing' },
};

describe('bluetoothSelectors', () => {
    it('selects knownDevices and nearbyDevices in one list fot the UI, all known devices are first', () => {
        const selectAllDevices = prepareSelectAllDevices<BluetoothDeviceCommon>();

        const state: WithBluetoothState<BluetoothDeviceCommon> = {
            bluetooth: {
                ...prepareInitialState(),
                knownDevices: [pairingDeviceStateA, disconnectedDeviceB],
                nearbyDevices: [
                    {
                        ...pairingDeviceStateA,
                        connectionStatus: { type: 'connected' },
                    },
                    pairingDeviceStateC,
                ],
            },
        };

        const devices = selectAllDevices(state);

        expect(devices).toEqual([
            { ...disconnectedDeviceB, connectionStatus: { type: 'disconnected' } }, // from knownDevices only, first in the list
            { ...pairingDeviceStateA, connectionStatus: { type: 'connected' } }, // override by nearbyDevices
            pairingDeviceStateC, // from nearbyDevices only
        ]);

        const devicesSecondTime = selectAllDevices(state);
        expect(devices === devicesSecondTime).toBe(true); // Asserts that `reselect` memoization works
    });
});
