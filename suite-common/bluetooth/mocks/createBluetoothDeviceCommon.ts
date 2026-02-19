import { asBluetoothDeviceId } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { BluetoothDeviceCommon } from '../src/types';

/**
 * Generate a mock bluetooth known or nearby device.
 */
export const createBluetoothDeviceCommon = (
    partialBluetoothDevice?: Partial<BluetoothDeviceCommon>,
): BluetoothDeviceCommon => ({
    id: asBluetoothDeviceId('bt-device-1'),
    name: 'Mock Trezor bt-device-1',
    manufacturerData: {
        deviceModel: DeviceModelInternal.T3W1,
        deviceColor: 0,
        filterPolicy: undefined,
    },
    lastUpdatedTimestamp: 1,
    connectionStatus: { type: 'connected' },
    ...partialBluetoothDevice,
});
