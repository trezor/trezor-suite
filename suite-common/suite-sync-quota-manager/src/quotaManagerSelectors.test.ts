import { type DeviceRootState, deviceReducerInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { quotaManagerInitialState } from './quotaManagerReducer';
import {
    type WithSuiteSyncQuotaManagerState,
    selectShouldDisplayOutOfQuotaAlert,
} from './quotaManagerSelectors';

const deviceId = 'device-123';
const device = mockSuiteDevice({ id: deviceId });

type MockState = DeviceRootState & WithSuiteSyncQuotaManagerState;

const createMockState = (unspentStorageSize: number): MockState => ({
    device: {
        ...deviceReducerInitialState,
        devices: [device],
        selectedDevice: device,
    },
    suiteSyncQuotaManager: {
        ...quotaManagerInitialState,
        registeredDevices: [
            {
                deviceId,
                totalStorageSize: 1024,
                unspentStorageSize,
                dismissedNoQuotaLeftWarning: false,
            },
        ],
    },
});

describe(selectShouldDisplayOutOfQuotaAlert.name, () => {
    it('does not display the alert while the device still has quota left', () => {
        expect(selectShouldDisplayOutOfQuotaAlert(createMockState(500))).toBe(false);
    });

    it('displays the alert when the device has no quota left', () => {
        expect(selectShouldDisplayOutOfQuotaAlert(createMockState(0))).toBe(true);
    });

    it('displays the alert when the device quota is negative', () => {
        expect(selectShouldDisplayOutOfQuotaAlert(createMockState(-500))).toBe(true);
    });
});
