import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import * as deviceUtils from '@suite-common/suite-utils';
import { defaultDevicePersistentData } from '@suite-common/wallet-core/src/support/deviceMocks';

import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { AcquiredDevice, AppState } from 'src/types/suite';

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
    throw 'mockSuiteDevice() must return an AcquiredDevice here.';
}

const fixtures: Fixture[] = [
    {
        description: 'returns false if all checks pass',
        state: {
            ...initialAppState,
            messageSystem: messageSystemInitialState,
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
            messageSystem: messageSystemInitialState,
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
            messageSystem: messageSystemInitialState,
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
            messageSystem: messageSystemInitialState,
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
            messageSystem: messageSystemInitialState,
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
            suite: {
                ...initialAppState.suite,
                settings: {
                    ...initialAppState.suite.settings,
                    enabledSecurityChecks: {
                        ...initialAppState.suite.settings.enabledSecurityChecks,
                        firmwareRevision: false,
                    },
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if entropy check errored',
        state: {
            ...initialAppState,
            messageSystem: messageSystemInitialState,
            device: {
                ...initialAppState.device,
                persistentDeviceData: [
                    {
                        ...defaultDevicePersistentData,
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
            messageSystem: messageSystemInitialState,
            device: {
                ...initialAppState.device,
                persistentDeviceData: [
                    {
                        ...defaultDevicePersistentData,
                        lastEntropyCheckResult: { success: false },
                    },
                ],
                selectedDevice: {
                    ...defaultDevice,
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
            suite: {
                ...initialAppState.suite,
                settings: {
                    ...initialAppState.suite.settings,
                    enabledSecurityChecks: {
                        ...initialAppState.suite.settings.enabledSecurityChecks,
                        entropy: false,
                    },
                },
            },
        },
        result: false,
    },
];

describe(selectShouldDisplayDeviceCompromisedOnRoute.name, () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(selectShouldDisplayDeviceCompromisedOnRoute(f.state as AppState)).toBe(f.result);
        });
    });
});
