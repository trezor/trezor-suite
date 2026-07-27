import {
    type BluetoothDeviceCommon,
    type BluetoothState,
    prepareInitialState,
} from '@suite-common/bluetooth';
import { createBluetoothDeviceCommon } from '@suite-common/bluetooth/mocks';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type ThpState, initialThpState } from '@suite-common/thp';
import { createCredential, createDeviceThp } from '@suite-common/thp/mocks';
import { asBluetoothDeviceId } from '@trezor/connect';

type ForgetPersistentDataPreloadedState = {
    device: DeviceReducerState;
    bluetooth: BluetoothState<BluetoothDeviceCommon>;
    thp: ThpState;
};

const credential1A = createCredential({ credential: '1A' });
const credential1B = createCredential({ credential: '1B' });
const credential1C = createCredential({ credential: '1C' });
const credential2 = createCredential({ credential: '2' });
const orphanedCredential = createCredential({ credential: '4' });

const DEV1 = mockSuiteDevice({
    id: 'device-id-1',
    descriptor: { apiType: 'bluetooth', id: 'bt-id-1' },
    thp: createDeviceThp({
        credentials: [credential1A, credential1B, credential1C],
    }),
});

const DEV2 = mockSuiteDevice({
    id: 'device-id-2',
    thp: createDeviceThp({ credentials: [credential2] }),
});

const DEV3 = mockSuiteDevice({
    id: 'device-id-3',
    descriptor: { apiType: 'bluetooth', id: 'bt-id-3' },
    thp: createDeviceThp({ credentials: [] }),
});

export const forgetPersistentDataPreloadedStateFixture: ForgetPersistentDataPreloadedState = {
    device: {
        ...deviceInitialState,
        devices: [DEV1, DEV2, DEV3],
        persistentDeviceData: [
            {
                ...defaultDevicePersistentData,
                device_id: DEV1.id!,
                descriptor: { apiType: 'bluetooth', id: 'bt-id-1' } as const,
                thp: DEV1.thp,
            },
            {
                ...defaultDevicePersistentData,
                device_id: DEV2.id!,
                thp: DEV2.thp,
            },
            {
                ...defaultDevicePersistentData,
                device_id: DEV3.id!,
                descriptor: { apiType: 'bluetooth', id: 'bt-id-3' } as const,
            },
        ],
    },

    bluetooth: {
        ...prepareInitialState<BluetoothDeviceCommon>(),
        knownDevices: [
            createBluetoothDeviceCommon({ id: asBluetoothDeviceId('bt-id-1') }),
            createBluetoothDeviceCommon({ id: asBluetoothDeviceId('bt-id-4') }),
        ],
    },

    thp: {
        ...initialThpState,
        credentials: [credential1A, credential1B, credential2, orphanedCredential],
    },
};
