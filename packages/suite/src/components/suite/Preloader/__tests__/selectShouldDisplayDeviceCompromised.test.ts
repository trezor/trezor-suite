import { messageSystemInitialState } from '@suite-common/message-system';
import { DeepPartial } from '@trezor/type-utils';

import { AcquiredDevice, AppState } from 'src/types/suite';

import { selectShouldDisplayDeviceCompromised } from '../selectShouldDisplayDeviceCompromised';

type Fixture = {
    description: string;
    state: DeepPartial<AppState>;
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

const suiteAllSettingsEnabled: DeepPartial<AppState['suite']> = {
    settings: {
        enabledSecurityChecks: { firmwareRevision: true, firmwareHash: true, entropy: true },
    },
};

const fixtures: Fixture[] = [
    {
        description: 'returns false if all checks pass',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
            suite: suiteAllSettingsEnabled,
        },
        result: false,
    },
    {
        description: 'returns false if check fails, but on a skipped route',
        state: {
            router: { route: { app: 'settings' } },
            messageSystem: messageSystemInitialState,
            device: {
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksFail,
                },
            },
            suite: suiteAllSettingsEnabled,
        },
        result: false,
    },
    {
        description: 'returns true if firmware check failed and not dismissed',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksFail,
                },
            },
            suite: suiteAllSettingsEnabled,
        },
        result: true,
    },
    {
        description: 'returns false if firmware check failed and dismissed',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                dismissedSecurityChecks: { firmwareAuthenticity: ['deviceId'] },
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksFail,
                },
            },
            suite: suiteAllSettingsEnabled,
        },
        result: false,
    },
    {
        description: 'returns false if a firmware check failed but is disabled',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: {
                        firmwareRevision: { success: false, error: 'revision-mismatch' },
                        firmwareHash: { success: true },
                    },
                },
            },
            suite: {
                settings: {
                    enabledSecurityChecks: {
                        firmwareRevision: false,
                        firmwareHash: true,
                        entropy: true,
                    },
                },
            },
        },
        result: false,
    },
    {
        description: 'returns true if entropy check failed',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                devicesWithFailedEntropyCheck: ['deviceId'],
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
            suite: suiteAllSettingsEnabled,
        },
        result: true,
    },
    {
        description: 'returns false if entropy check failed but is disabled',
        state: {
            router: { route: { app: 'dashboard' } },
            messageSystem: messageSystemInitialState,
            device: {
                devicesWithFailedEntropyCheck: ['deviceId'],
                selectedDevice: {
                    features: {},
                    id: 'deviceId',
                    authenticityChecks: authenticityChecksSuccess,
                },
            },
            suite: { settings: { enabledSecurityChecks: { entropy: false } } },
        },
        result: false,
    },
];

describe(selectShouldDisplayDeviceCompromised.name, () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            expect(selectShouldDisplayDeviceCompromised(f.state as AppState)).toBe(f.result);
        });
    });
});
