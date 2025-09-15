import { BluetoothState, prepareInitialState } from '@suite-common/bluetooth';
import { createBluetoothDevice } from '@suite-common/bluetooth/src/support/mocks';
import { BluetoothDeviceCommon } from '@suite-common/bluetooth/src/types';
import { PersistentDeviceData } from '@suite-common/suite-types';
import { ThpState, initialThpState } from '@suite-common/thp';
import { createCredential, createDeviceThp } from '@suite-common/thp/src/support/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { DeviceReducerState, deviceInitialState } from '../deviceReducer';

type ForgetPersistentDataPreloadedState = {
    device: DeviceReducerState;
    bluetooth: BluetoothState<BluetoothDeviceCommon>;
    thp: ThpState;
};

const BTDevice1 = createBluetoothDevice({ id: 'bt-id-1' });
const BTDevice3 = createBluetoothDevice({ id: 'bt-id-3' });
const orphanedBTDevice = createBluetoothDevice({ id: 'bt-id-4' });

const credential1A = createCredential({ credential: '1A' });
const credential1B = createCredential({ credential: '1B' });
const credential1C = createCredential({ credential: '1C' });
const credential2 = createCredential({ credential: '2' });
const orphanedCredential = createCredential({ credential: '4' });

const defaultDevicePersistentData: PersistentDeviceData = {
    device_id: 'device-id',
    internal_model: DeviceModelInternal.UNKNOWN,
    fw_vendor: null,
    revision: null,
    label: null,
    initialized: null,
    firmwareVersion: null,
    lastConnectedBy: null,
};

export const forgetPersistentDataPreloadedStateFixture: ForgetPersistentDataPreloadedState = {
    device: {
        ...deviceInitialState,
        persistentDeviceData: [
            {
                ...defaultDevicePersistentData,
                device_id: 'device-id-1',
                bluetoothProps: { id: BTDevice1.id },
                thp: {
                    ...createDeviceThp(),
                    credentials: [credential1A, credential1B, credential1C],
                },
            },
            {
                ...defaultDevicePersistentData,
                device_id: 'device-id-2',
                thp: {
                    ...createDeviceThp(),
                    credentials: [credential2],
                },
            },
            {
                ...defaultDevicePersistentData,
                device_id: 'device-id-3',
                bluetoothProps: { id: BTDevice3.id },
            },
        ],
    },

    bluetooth: {
        ...prepareInitialState<BluetoothDeviceCommon>(),
        knownDevices: [BTDevice1, orphanedBTDevice],
    },

    thp: {
        ...initialThpState,
        credentials: [credential1A, credential1B, credential2, orphanedCredential],
    },
};
