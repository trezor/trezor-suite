import { BluetoothDeviceState, prepareSelectAllDevices } from '../src';
import { BluetoothDeviceCommon, BluetoothState } from '../src/bluetoothReducer';
import { WithBluetoothState } from '../src/bluetoothSelectors';

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as BluetoothDeviceState<BluetoothDeviceCommon>[],
    knownDevices: [] as BluetoothDeviceCommon[],
};

describe('bluetoothSelectors', () => {
    it('selects knownDevices and nearbyDevices in one list fot the UI', () => {
        const selectAllDevices = prepareSelectAllDevices<BluetoothDeviceCommon>();

        const pairingNearbyDeviceA: BluetoothDeviceState<BluetoothDeviceCommon> = {
            device: {
                id: 'A',
                data: [],
                name: 'Trezor A',
                lastUpdatedTimestamp: 1,
            },
            status: { type: 'pairing' },
        };

        const knownDeviceB: BluetoothDeviceCommon = {
            id: 'B',
            data: [],
            name: 'Trezor B',
            lastUpdatedTimestamp: 2,
        };

        const state: WithBluetoothState<BluetoothDeviceCommon> = {
            bluetooth: {
                ...initialState,
                nearbyDevices: [pairingNearbyDeviceA],
                knownDevices: [knownDeviceB],
            },
        };

        const devices = selectAllDevices(state);

        expect(devices).toEqual([{ device: knownDeviceB, status: null }, pairingNearbyDeviceA]);

        const devicesSecondTime = selectAllDevices(state);
        expect(devices === devicesSecondTime).toBe(true); // Asserts that `reselect` memoization works
    });
});
