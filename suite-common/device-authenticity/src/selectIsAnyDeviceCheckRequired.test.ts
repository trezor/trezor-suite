import type { PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import type {
    DeviceAuthenticityCheckSettings,
    PersistentDeviceData,
    TrezorDevice,
} from '@suite-common/suite-types';
import {
    defaultDevicePersistentData,
    mockStoredAuthenticateDeviceResult,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { selectIsAnyDeviceCheckRequired } from './selectIsAnyDeviceCheckRequired';

const DEVICE_ID = 'device-id';

const enabledSettings: DeviceAuthenticityCheckSettings = {
    isDeviceAuthenticityCheckEnabled: true,
    isUnlockedBootloaderAllowed: false,
};

const mockConnectedDevice = (): TrezorDevice =>
    mockSuiteDevice(
        { id: DEVICE_ID, connected: true, available: true },
        { internal_model: DeviceModelInternal.T3T1, bootloader_locked: true },
    );

const mockState = (
    persistentDeviceData?: Partial<PersistentDeviceData>,
): PersistentDeviceDataRootState => ({
    persistentDeviceData: {
        devices: persistentDeviceData
            ? [{ ...defaultDevicePersistentData, device_id: DEVICE_ID, ...persistentDeviceData }]
            : [],
    },
});

describe(selectIsAnyDeviceCheckRequired.name, () => {
    it('returns true when the manual check has not been done', () => {
        const state = mockState({
            manualCheckResult: undefined,
            authenticityResult: mockStoredAuthenticateDeviceResult(),
        });

        expect(selectIsAnyDeviceCheckRequired(state, mockConnectedDevice(), enabledSettings)).toBe(
            true,
        );
    });

    it('returns true when only the authenticity check is pending', () => {
        const state = mockState({ manualCheckResult: { success: true } });

        expect(selectIsAnyDeviceCheckRequired(state, mockConnectedDevice(), enabledSettings)).toBe(
            true,
        );
    });

    it('returns false when both checks have succeeded', () => {
        const state = mockState({
            manualCheckResult: { success: true },
            authenticityResult: mockStoredAuthenticateDeviceResult(),
        });

        expect(selectIsAnyDeviceCheckRequired(state, mockConnectedDevice(), enabledSettings)).toBe(
            false,
        );
    });

    it('returns false when the device is not connected', () => {
        expect(selectIsAnyDeviceCheckRequired(mockState(), undefined, enabledSettings)).toBe(false);
    });
});
