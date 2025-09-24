import { messageSystemInitialState } from '@suite-common/message-system';
import { testMocks } from '@suite-common/test-utils';
import { defaultDevicePersistentData } from '@suite-common/wallet-core/src/support/deviceMocks';

import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { AcquiredDevice, AppState } from 'src/types/suite';

import { selectShouldDisplayDeviceCompromisedOnRoute } from '../selectShouldDisplayDeviceCompromised';

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

// TODO fix the mocks. The device actually is acquired, but the function casts it to TrezorDevice, why???
const defaultDevice = testMocks.getSuiteDevice() as AcquiredDevice;

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
        description: 'returns false if check fails, but on a skipped route',
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
        description: 'returns true if firmware check failed and not dismissed',
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
        description: 'returns false if firmware check failed and dismissed',
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
        description: 'returns false if a firmware check failed but is disabled',
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
        description: 'returns true if entropy check failed',
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
        description: 'returns false if entropy check failed but is disabled',
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
