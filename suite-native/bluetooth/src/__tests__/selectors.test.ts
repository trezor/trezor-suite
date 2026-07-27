import { prepareInitialState } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type NativeBluetoothState } from '../bluetoothSlice';
import {
    selectHasKnownBluetoothDevices,
    selectKnownConnectableBluetoothDevices,
    selectNearbyBluetoothDevices,
    selectNearbyPairableBluetoothDevices,
} from '../selectors';
import { type BluetoothDevice } from '../types';

const initialState: NativeBluetoothState = {
    ...prepareInitialState<BluetoothDevice>(),
    autoConnectPolicy: {
        [asBluetoothDeviceId('1ec77690-be29-43c6-8859-dfeca15c7c0f')]: {
            type: 'autoconnect-disabled',
        },
    },
    permissionStatus: 'granted',
};

const unknownDevice: BluetoothDevice = {
    id: asBluetoothDeviceId('4de11222-cef9-43fa-aee2-ffa77c697a29'),
    name: 'Disconnected TS7',
    connectionStatus: { type: 'disconnected' },
    lastUpdatedTimestamp: Date.now(),
    manufacturerData: {
        deviceModel: DeviceModelInternal.UNKNOWN,
        deviceColor: 0,
    },
};

const knownDevice: BluetoothDevice = {
    id: asBluetoothDeviceId('7a39820f-6387-4251-b066-46ed70d37d3f'),
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
            user_disconnected: false,
        },
    },
};
const knownAutoConnectDisabledDevice: BluetoothDevice = {
    ...knownDevice,
    id: asBluetoothDeviceId('1ec77690-be29-43c6-8859-dfeca15c7c0f'),
};
const knownConnectingDevice: BluetoothDevice = {
    ...knownDevice,
    id: asBluetoothDeviceId('2d000bf2-b8b7-4920-b907-540507c4562e'),
    connectionStatus: { type: 'connecting' },
};
const knownPairableDevice: BluetoothDevice = {
    ...knownDevice,
    id: asBluetoothDeviceId('32ca56ec-9835-4ffd-a191-c11c43199abe'),
    manufacturerData: {
        ...knownDevice.manufacturerData,
        filterPolicy: {
            pairing: true,
            connected: false,
            bond_memory_full: false,
            user_disconnected: false,
        },
    },
};
const knownUserDisconnectedDevice: BluetoothDevice = {
    ...knownDevice,
    id: asBluetoothDeviceId('703c0b54-6b17-423a-9221-04353ceec796'),
    manufacturerData: {
        ...knownDevice.manufacturerData,
        filterPolicy: {
            pairing: false,
            connected: false,
            bond_memory_full: false,
            user_disconnected: true,
        },
    },
};

const pairableDevice: BluetoothDevice = {
    id: asBluetoothDeviceId('653ab4bc-d0b5-47d7-ab5d-ad834e4956f5'),
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
            user_disconnected: false,
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
        ['null nearby devices', null, [], []],
        ['empty nearby devices', [], [], []],
        ['non-pairable nearby device', [knownDevice], [], []],
        ['pairable nearby device', [pairableDevice], [], [pairableDevice]],
        ['pairable known device', [pairableDevice], [pairableDevice], []],
        [
            'several nearby devices',
            [unknownDevice, knownDevice, pairableDevice],
            [],
            [pairableDevice],
        ],
    ])('returns correct value for %s', (_, nearbyDevices, knownDevices, expectedDevices) => {
        expect(
            selectNearbyPairableBluetoothDevices({
                bluetooth: {
                    ...initialState,
                    nearbyDevices,
                    knownDevices,
                },
            }),
        ).toStrictEqual(expectedDevices);
        expect(
            selectNearbyPairableBluetoothDevices(
                {
                    bluetooth: {
                        ...initialState,
                        nearbyDevices,
                    },
                },
                knownDevices,
            ),
        ).toStrictEqual(expectedDevices);
    });
});

describe('selectKnownConnectableBluetoothDevices', () => {
    test.each([
        ['null nearby devices', null, [knownDevice], []],
        ['empty nearby devices', [], [knownDevice], []],
        ['no known devices', [knownDevice], [], []],
        [
            'some known devices',
            [
                pairableDevice,
                knownDevice,
                knownAutoConnectDisabledDevice,
                knownConnectingDevice,
                knownPairableDevice,
                knownUserDisconnectedDevice,
            ],
            [
                knownDevice,
                knownAutoConnectDisabledDevice,
                knownConnectingDevice,
                knownPairableDevice,
                knownUserDisconnectedDevice,
            ],
            [knownDevice, knownUserDisconnectedDevice],
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
