import { createRouterStateMock } from '@suite/router/mocks';
import { suiteSettingsInitialState } from '@suite/settings';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import * as deviceUtils from '@suite-common/suite-utils';

import { selectIsDeviceCompromised } from './authenticityChecksSelectors';
import type { AuthenticityChecksRootState } from './types';

const defaultDevice = mockSuiteDevice();
if (!deviceUtils.isDeviceAcquired(defaultDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}

const initialState: AuthenticityChecksRootState = {
    device: deviceInitialState,
    messageSystem: messageSystemInitialState,
    router: createRouterStateMock(),
    suiteSettings: suiteSettingsInitialState,
    persistentDeviceData: persistentDeviceDataInitialState,
};

const matchingDevicePersistentData = {
    ...defaultDevicePersistentData,
    device_id: defaultDevice.features.device_id,
    unit_color: defaultDevice.features.unit_color,
    internal_model: defaultDevice.features.internal_model,
};

const allChecksPassState: AuthenticityChecksRootState = {
    ...initialState,
    device: { ...initialState.device, selectedDevice: defaultDevice },
    persistentDeviceData: { devices: [matchingDevicePersistentData] },
};

const discoveryEntropyCheckFailState: AuthenticityChecksRootState = {
    ...allChecksPassState,
    persistentDeviceData: {
        devices: [
            {
                ...matchingDevicePersistentData,
                lastEntropyCheckResult: {
                    success: true,
                    discoveryCheckFailedPaths: ["m/84'/0'/0'"],
                },
            },
        ],
    },
};

const firmwareRevisionCheckFailState: AuthenticityChecksRootState = {
    ...allChecksPassState,
    device: {
        ...allChecksPassState.device,
        selectedDevice: {
            ...defaultDevice,
            authenticityChecks: {
                ...defaultDevice.authenticityChecks,
                firmwareRevision: { success: false, error: 'revision-mismatch' },
            },
        },
    },
};

const firmwareHashCheckFailState: AuthenticityChecksRootState = {
    ...allChecksPassState,
    device: {
        ...allChecksPassState.device,
        selectedDevice: {
            ...defaultDevice,
            authenticityChecks: {
                ...defaultDevice.authenticityChecks,
                firmwareHash: { success: false, error: 'hash-mismatch' },
            },
        },
    },
};

describe(selectIsDeviceCompromised.name, () => {
    it('returns false if all checks pass', () => {
        expect(selectIsDeviceCompromised(allChecksPassState)).toBe(false);
    });

    it('returns true if discovery entropy check failed, even if dismissed', () => {
        const state: AuthenticityChecksRootState = {
            ...discoveryEntropyCheckFailState,
            device: {
                ...discoveryEntropyCheckFailState.device,
                dismissedSecurityChecks: { discoveryEntropy: ['device-id'] },
            },
        };

        expect(selectIsDeviceCompromised(state)).toBe(true);
    });

    it('returns true if firmware revision check failed, even if dismissed', () => {
        const state: AuthenticityChecksRootState = {
            ...firmwareRevisionCheckFailState,
            device: {
                ...firmwareRevisionCheckFailState.device,
                dismissedSecurityChecks: { firmwareAuthenticity: ['device-id'] },
            },
        };

        expect(selectIsDeviceCompromised(state)).toBe(true);
    });

    it('returns false if firmware revision check failed but is disabled', () => {
        const state: AuthenticityChecksRootState = {
            ...firmwareRevisionCheckFailState,
            suiteSettings: {
                ...initialState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialState.suiteSettings.enabledSecurityChecks,
                    firmwareRevision: false,
                },
            },
        };

        expect(selectIsDeviceCompromised(state)).toBe(false);
    });

    it('returns true if firmware hash check failed, even if dismissed', () => {
        const state: AuthenticityChecksRootState = {
            ...firmwareHashCheckFailState,
            device: {
                ...firmwareHashCheckFailState.device,
                dismissedSecurityChecks: { firmwareAuthenticity: ['device-id'] },
            },
        };

        expect(selectIsDeviceCompromised(state)).toBe(true);
    });

    it('returns false if firmware hash check failed but is disabled', () => {
        const state: AuthenticityChecksRootState = {
            ...firmwareHashCheckFailState,
            suiteSettings: {
                ...initialState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialState.suiteSettings.enabledSecurityChecks,
                    firmwareHash: false,
                },
            },
        };

        expect(selectIsDeviceCompromised(state)).toBe(false);
    });
});
