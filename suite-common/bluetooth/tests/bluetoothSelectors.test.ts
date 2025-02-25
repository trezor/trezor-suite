import { BluetoothDeviceState, prepareSelectAllDevices } from '../src';
import { BluetoothDeviceCommon, BluetoothState } from '../src/bluetoothReducer';
import { WithBluetoothState } from '../src/bluetoothSelectors';

const initialState: BluetoothState<BluetoothDeviceCommon> = {
    adapterStatus: 'unknown',
    scanStatus: 'idle',
    nearbyDevices: [] as BluetoothDeviceState<BluetoothDeviceCommon>[],
    knownDevices: [] as BluetoothDeviceCommon[],
};

const pairingDeviceStateA: BluetoothDeviceState<BluetoothDeviceCommon> = {
    device: {
        id: 'A',
        data: [],
        name: 'Trezor A',
        lastUpdatedTimestamp: 1,
    },
    status: { type: 'pairing' },
};

const deviceB: BluetoothDeviceCommon = {
    id: 'B',
    data: [],
    name: 'Trezor B',
    lastUpdatedTimestamp: 2,
};

describe('bluetoothSelectors', () => {
    it('selects knownDevices and nearbyDevices in one list fot the UI', () => {
        const selectAllDevices = prepareSelectAllDevices<BluetoothDeviceCommon>();

        const state: WithBluetoothState<BluetoothDeviceCommon> = {
            bluetooth: {
                ...initialState,
                nearbyDevices: [pairingDeviceStateA],
                knownDevices: [pairingDeviceStateA.device, deviceB],
            },
        };

        const devices = selectAllDevices(state);

        expect(devices).toEqual([{ device: deviceB, status: null }, pairingDeviceStateA]);

        const devicesSecondTime = selectAllDevices(state);
        expect(devices === devicesSecondTime).toBe(true); // Asserts that `reselect` memoization works
    });
});
