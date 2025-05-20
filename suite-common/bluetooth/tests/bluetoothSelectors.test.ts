import { prepareSelectAllDevices } from '../src';
import { BluetoothDeviceCommon, BluetoothState } from '../src/bluetoothReducer';
import { WithBluetoothState } from '../src/bluetoothSelectors';

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    isBluetoothListOpen: false,
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as BluetoothDeviceCommon[],
    knownDevices: [] as BluetoothDeviceCommon[],
    unpairedDeviceNeedsManualOsRemoval: false,
    connectingDeviceIds: [],
};

const pairingDeviceStateA: BluetoothDeviceCommon = {
    id: 'A',
    data: [],
    name: 'Trezor A',
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'pairing' },
};

const disconnectedDeviceB: BluetoothDeviceCommon = {
    id: 'B',
    data: [],
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
    connectionStatus: { type: 'disconnected' },
};

const pairingDeviceStateC: BluetoothDeviceCommon = {
    id: 'C',
    data: [],
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
