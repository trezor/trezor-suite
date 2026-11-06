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

import { selectShouldCheckDeviceAuthenticity } from './selectShouldCheckDeviceAuthenticity';

const DEVICE_ID = 'device-id';

const enabledSettings: DeviceAuthenticityCheckSettings = {
    isDeviceAuthenticityCheckEnabled: true,
    isUnlockedBootloaderAllowed: false,
};

type MockConnectedDeviceParams = {
    internalModel?: DeviceModelInternal;
    isBootloaderLocked?: boolean;
};

const mockConnectedDevice = ({
    internalModel = DeviceModelInternal.T3T1,
    isBootloaderLocked = true,
}: MockConnectedDeviceParams = {}): TrezorDevice =>
    mockSuiteDevice(
        { id: DEVICE_ID, connected: true, available: true },
        { internal_model: internalModel, bootloader_locked: isBootloaderLocked },
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

describe(selectShouldCheckDeviceAuthenticity.name, () => {
    it('returns true for a supported device without a persisted result', () => {
        expect(
            selectShouldCheckDeviceAuthenticity(
                mockState(),
                mockConnectedDevice(),
                enabledSettings,
            ),
        ).toBe(true);
    });

    it('returns false when a successful result is persisted', () => {
        const state = mockState({ authenticityResult: mockStoredAuthenticateDeviceResult() });

        expect(
            selectShouldCheckDeviceAuthenticity(state, mockConnectedDevice(), enabledSettings),
        ).toBe(false);
    });

    it('returns true when a failed result is persisted, so the check is retried', () => {
        const state = mockState({ authenticityResult: { valid: false, error: 'error' } });

        expect(
            selectShouldCheckDeviceAuthenticity(state, mockConnectedDevice(), enabledSettings),
        ).toBe(true);
    });

    it('returns false when the check is disabled', () => {
        expect(
            selectShouldCheckDeviceAuthenticity(mockState(), mockConnectedDevice(), {
                ...enabledSettings,
                isDeviceAuthenticityCheckEnabled: false,
            }),
        ).toBe(false);
    });

    it('returns false for a device not supporting the check', () => {
        const device = mockConnectedDevice({ internalModel: DeviceModelInternal.T2T1 });

        expect(selectShouldCheckDeviceAuthenticity(mockState(), device, enabledSettings)).toBe(
            false,
        );
    });

    it('respects the setting tolerating an unlocked bootloader', () => {
        const device = mockConnectedDevice({ isBootloaderLocked: false });

        expect(selectShouldCheckDeviceAuthenticity(mockState(), device, enabledSettings)).toBe(
            true,
        );
        expect(
            selectShouldCheckDeviceAuthenticity(mockState(), device, {
                ...enabledSettings,
                isUnlockedBootloaderAllowed: true,
            }),
        ).toBe(false);
    });
});
