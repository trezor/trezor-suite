import { createRouterStateMock } from '@suite/router/mocks';
import { suiteSettingsInitialState } from '@suite/settings';
import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import * as deviceUtils from '@suite-common/suite-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    type AuthenticityChecksRootState,
    selectShouldDisplayDeviceCompromised,
} from './authenticityChecksSelectors';

type Fixture = {
    description: string;
    state: AuthenticityChecksRootState;
    result: boolean;
};

const authenticityChecksFail: AcquiredDevice['authenticityChecks'] = {
    firmwareRevision: { success: false, error: 'revision-mismatch' },
    firmwareHash: { success: false, error: 'hash-mismatch' },
};

const defaultDevice = mockSuiteDevice();
if (!deviceUtils.isDeviceAcquired(defaultDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}
const authenticityChecksSuccess = defaultDevice.authenticityChecks;

const initialState: AuthenticityChecksRootState = {
    device: deviceInitialState,
    messageSystem: messageSystemInitialState,
    router: createRouterStateMock(),
    suiteSettings: suiteSettingsInitialState,
};

const matchingDevicePersistentData = {
    ...defaultDevicePersistentData,
    device_id: defaultDevice.features.device_id,
    unit_color: defaultDevice.features.unit_color,
    internal_model: defaultDevice.features.internal_model,
};

const fixtures: Fixture[] = [
    {
        description: 'returns false if all checks pass',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if firmware check errored and not dismissed',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksFail,
                },
            },
        },
        result: true,
    },
    {
        description: 'returns false if firmware check errored and dismissed',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                dismissedSecurityChecks: { firmwareAuthenticity: ['device-id'] },
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksFail,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns false if a firmware check errored but is disabled',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: {
                        firmwareRevision: { success: false, error: 'revision-mismatch' },
                        firmwareHash: { success: true },
                    },
                },
            },
            suiteSettings: {
                ...initialState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialState.suiteSettings.enabledSecurityChecks,
                    firmwareRevision: false,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if entropy check errored',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                persistentDeviceData: [
                    {
                        ...matchingDevicePersistentData,
                        lastEntropyCheckResult: { success: false },
                    },
                ],
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
        },
        result: true,
    },
    {
        description: 'returns false if entropy check errored but is disabled',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                persistentDeviceData: [
                    {
                        ...matchingDevicePersistentData,
                        lastEntropyCheckResult: { success: false },
                    },
                ],
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
            suiteSettings: {
                ...initialState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialState.suiteSettings.enabledSecurityChecks,
                    entropy: false,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true for a device with an invalid id',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                selectedDevice: { ...defaultDevice, id: null },
            },
        },
        result: true,
    },
    {
        description: 'returns true for a device with mismatch against its persistent data',
        state: {
            ...initialState,
            device: {
                ...initialState.device,
                persistentDeviceData: [matchingDevicePersistentData],
                selectedDevice: {
                    ...defaultDevice,
                    features: {
                        ...defaultDevice.features,
                        internal_model: DeviceModelInternal.T1B1,
                        unit_color: 333,
                    },
                },
            },
        },
        result: true,
    },
];

describe(selectShouldDisplayDeviceCompromised.name, () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(selectShouldDisplayDeviceCompromised(f.state)).toBe(f.result);
        });
    });
});
