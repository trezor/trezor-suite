import { DeviceModelInternal } from '@trezor/device-utils';

import { BluetoothFilterPolicy, BluetoothManufacturerData, prepareSelectAllDevices } from '../src';
import { BluetoothState } from '../src/bluetoothReducer';
import { WithBluetoothState } from '../src/bluetoothSelectors';
import { BluetoothDeviceCommon } from '../src/types';

const manufacturerData: BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal.T3W1,
    deviceColor: 0,
    filterPolicy: BluetoothFilterPolicy.UNFILTERED,
};

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    isBluetoothListOpen: false,
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [],
    knownDevices: [],
    unpairedDeviceNeedsManualOsRemoval: false,
    connectingDeviceIds: [],
};

const pairingDeviceStateA: BluetoothDeviceCommon = {
    id: 'A',
    manufacturerData,
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'pairing' },
};

const disconnectedDeviceB: BluetoothDeviceCommon = {
    id: 'B',
    manufacturerData,
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

const pairingDeviceStateC: BluetoothDeviceCommon = {
    id: 'C',
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
                ...initialState,
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
