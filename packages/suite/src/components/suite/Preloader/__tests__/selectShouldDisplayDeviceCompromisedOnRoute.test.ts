import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import * as deviceUtils from '@suite-common/suite-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { type AcquiredDevice, type AppState } from 'src/types/suite';

import { selectShouldDisplayDeviceCompromisedOnRoute } from '../selectShouldDisplayDeviceCompromisedOnRoute';

type Fixture = {
    description: string;
    state: AppState;
    result: boolean;
};

const authenticityChecksSuccess: AcquiredDevice['authenticityChecks'] = {
    firmwareRevision: { success: true },
    firmwareHash: null,
};

const authenticityChecksFail: AcquiredDevice['authenticityChecks'] = {
    firmwareRevision: { success: false, error: 'revision-mismatch' },
    firmwareHash: { success: false, error: 'hash-mismatch' },
};

const defaultDevice = mockSuiteDevice();
if (!deviceUtils.isDeviceAcquired(defaultDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}
// derived from this device
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
            ...initialAppState,
            device: {
                ...initialAppState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns false if check errors, but on a skipped route',
        state: {
            ...initialAppState,
            router: {
                ...initialAppState.router,
                // @ts-expect-error see defaultAppState comment about routerReducer typing
                route: {
                    name: 'settings-index',
                    pattern: '/settings',
                    app: 'settings',
                },
            },
            device: {
                ...initialAppState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksFail,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if firmware check errored and not dismissed',
        state: {
            ...initialAppState,
            device: {
                ...initialAppState.device,
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
            ...initialAppState,
            device: {
                ...initialAppState.device,
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
            ...initialAppState,
            device: {
                ...initialAppState.device,
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: {
                        firmwareRevision: { success: false, error: 'revision-mismatch' },
                        firmwareHash: { success: true },
                    },
                },
            },
            suiteSettings: {
                ...initialAppState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialAppState.suiteSettings.enabledSecurityChecks,
                    firmwareRevision: false,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if entropy check errored',
        state: {
            ...initialAppState,
            device: {
                ...initialAppState.device,
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
            ...initialAppState,
            device: {
                ...initialAppState.device,
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
                ...initialAppState.suiteSettings,
                enabledSecurityChecks: {
                    ...initialAppState.suiteSettings.enabledSecurityChecks,
                    entropy: false,
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true for a device with an invalid id',
        state: {
            ...initialAppState,
            device: { ...initialAppState.device, selectedDevice: { ...defaultDevice, id: null } },
        },
        result: true,
    },
    {
        description: 'returns true for a device with mismatch against its persistent data',
        state: {
            ...initialAppState,
            device: {
                ...initialAppState.device,
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

describe(selectShouldDisplayDeviceCompromisedOnRoute.name, () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(selectShouldDisplayDeviceCompromisedOnRoute(f.state as AppState)).toBe(f.result);
        });
    });
});
