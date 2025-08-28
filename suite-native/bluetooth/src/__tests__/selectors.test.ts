import { prepareInitialState } from '@suite-common/bluetooth';
import { DeviceModelInternal } from '@trezor/device-utils';

import { NativeBluetoothState } from '../bluetoothSlice';
import {
    selectHasKnownBluetoothDevices,
    selectKnownConnectableBluetoothDevices,
    selectNearbyBluetoothDevices,
    selectNearbyPairableBluetoothDevices,
} from '../selectors';
import { BluetoothDevice } from '../types';

const initialState: NativeBluetoothState = {
    ...prepareInitialState<BluetoothDevice>(),
    permissionStatus: 'granted',
};

const unknownDevice: BluetoothDevice = {
    id: '4de11222-cef9-43fa-aee2-ffa77c697a29',
    name: 'Disconnected TS7',
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: Date.now(),
    manufacturerData: {
        deviceModel: DeviceModelInternal.UNKNOWN,
        deviceColor: 0,
    },
};

const knownDevice: BluetoothDevice = {
    id: '7a39820f-6387-4251-b066-46ed70d37d3f',
    name: 'Disconnected TS7',
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: Date.now(),
    manufacturerData: {
        deviceModel: DeviceModelInternal.T3W1,
        deviceColor: 1,
        filterPolicy: {
            pairing: false,
            connected: false,
            bond_memory_full: false,
        },
    },
};
const knownConnectingDevice: BluetoothDevice = {
    ...knownDevice,
    connectionStatus: { type: 'connecting' },
};
const knownPairableDevice: BluetoothDevice = {
    ...knownDevice,
    manufacturerData: {
        ...knownDevice.manufacturerData,
        filterPolicy: {
            pairing: true,
            connected: false,
            bond_memory_full: false,
        },
    },
};

const pairableDevice: BluetoothDevice = {
    id: '653ab4bc-d0b5-47d7-ab5d-ad834e4956f5',
    name: 'Pairable TS7',
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: Date.now(),
    manufacturerData: {
        deviceModel: DeviceModelInternal.T3W1,
        deviceColor: 1,
        filterPolicy: {
            pairing: true,
            connected: false,
            bond_memory_full: false,
        },
    },
};

describe('selectHasKnownBluetoothDevices', () => {
    test.each([
        ['empty known devices', [], false],
        ['non-empty known devices', [knownDevice], true],
    ])('returns correct value for %s', (_, knownDevices, expectedValue) => {
        expect(
            selectHasKnownBluetoothDevices({
                bluetooth: {
                    ...initialState,
                    knownDevices,
                },
            }),
        ).toStrictEqual(expectedValue);
    });
});

describe('selectNearbyBluetoothDevices', () => {
    test.each([
        ['null nearby devices', null, []],
        ['empty nearby devices', [], []],
        ['non-empty nearby devices', [knownDevice, pairableDevice], [knownDevice, pairableDevice]],
    ])('returns correct value for %s', (_, nearbyDevices, expectedDevices) => {
        expect(
            selectNearbyBluetoothDevices({
                bluetooth: {
                    ...initialState,
                    nearbyDevices,
                },
            }),
        ).toStrictEqual(expectedDevices);
    });
});

describe('selectNearbyPairableBluetoothDevices', () => {
    test.each([
        ['null nearby devices', null, []],
        ['empty nearby devices', [], []],
        ['non-pairable nearby device', [knownDevice], []],
        ['pairable nearby device', [pairableDevice], [pairableDevice]],
        ['several nearby devices', [unknownDevice, knownDevice, pairableDevice], [pairableDevice]],
    ])('returns correct value for %s', (_, nearbyDevices, expectedDevices) => {
        expect(
            selectNearbyPairableBluetoothDevices({
                bluetooth: {
                    ...initialState,
                    nearbyDevices,
                },
            }),
        ).toStrictEqual(expectedDevices);
    });
});

describe('selectKnownConnectableBluetoothDevices', () => {
    test.each([
        ['null nearby devices', null, [knownDevice], []],
        ['empty nearby devices', [], [knownDevice], []],
        ['no known devices', [knownDevice], [], []],
        [
            'one known device',
            [pairableDevice, knownDevice, knownConnectingDevice, knownPairableDevice],
            [knownDevice],
            [knownDevice],
        ],
    ])('returns correct value for %s', (_, nearbyDevices, knownDevices, expectedDevices) => {
        expect(
            selectKnownConnectableBluetoothDevices({
                bluetooth: {
                    ...initialState,
                    nearbyDevices,
                    knownDevices,
                },
            }),
        ).toStrictEqual(expectedDevices);
    });
});
