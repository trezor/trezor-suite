import '@suite-common/test-utils/src/globalOverrides';

import { TranslationKey } from '@suite/intl';
import * as deviceUtils from '@suite-common/suite-utils';
import { extraDependenciesMock, testMocks } from '@suite-common/test-utils';
import { DeviceReducerState, deviceInitialState } from '@suite-common/wallet-core';
import { defaultDevicePersistentData } from '@suite-common/wallet-core/src/support/deviceMocks';

import { AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { DeviceCompromised } from '../DeviceCompromised';

jest.mock('@suite-common/tx-simulation', () => ({}));

// !!! Must be a stable reference, else it will break some hooks / memoization and causes inf. re-renders
const translationStringMock = (id: string) => id;

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: any) => <span data-testid={id}>{id}</span>,
    useTranslation: () => ({ translationString: translationStringMock }),
}));

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const mockStore = configureStore<AppState, any>();

const initStore = (state: AppState) => mockStore(state);

const getInitialState = (device: DeviceReducerState): AppState =>
    ({
        ...initialAppState,
        device,
        wallet: {
            ...initialAppState.wallet,
            selectedAccount: initialAppState.wallet?.selectedAccount ?? { account: null },
            accounts: initialAppState.wallet?.accounts ?? [],
        },
    }) as AppState;

const defaultDevice = testMocks.getSuiteDevice();
if (!deviceUtils.isDeviceAcquired(defaultDevice)) {
    throw 'testMocks.getSuiteDevice() must return an AcquiredDevice here.';
}

const deviceCompromisedFixtures: Array<{
    description: string;
    device: DeviceReducerState;
    result: TranslationKey;
}> = [
    {
        description: 'Errored entropy check',
        device: {
            ...deviceInitialState,
            persistentDeviceData: [
                {
                    ...defaultDevicePersistentData,
                    lastEntropyCheckResult: { success: false },
                },
            ],
            selectedDevice: testMocks.getSuiteDevice(),
        },
        result: 'TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT',
    },
    {
        description: 'Errored firmware hash check',
        device: {
            ...deviceInitialState,
            selectedDevice: {
                ...defaultDevice,
                authenticityChecks: {
                    firmwareHash: {
                        success: false,
                        error: 'hash-mismatch',
                    },
                    firmwareRevision: { success: true },
                },
            },
        },
        result: 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
    },
    {
        description: 'Firmware hash check other-error (1st occurrence)',
        device: {
            ...deviceInitialState,
            selectedDevice: {
                ...defaultDevice,
                connected: true,
                authenticityChecks: {
                    firmwareHash: {
                        success: false,
                        error: 'other-error',
                    },
                    firmwareRevision: { success: true },
                },
            },
        },
        result: 'TR_FAILED_VERIFY_DEVICE_TEXT',
    },
    {
        description: 'Firmware hash check other-error (2nd occurrence)',
        device: {
            ...deviceInitialState,
            selectedDevice: {
                ...defaultDevice,
                connected: true,
                authenticityChecks: {
                    firmwareHash: {
                        success: false,
                        error: 'other-error',
                    },
                    firmwareRevision: { success: true },
                },
            },
            lastConnectedAuthenticityChecks: {
                firmwareHash: {
                    success: false,
                    error: 'other-error',
                },
                firmwareRevision: { success: true },
            },
        },
        result: 'TR_FAILED_VERIFY_DEVICE_AGAIN_TEXT',
    },
    {
        description: 'Errored firmware revision check',
        device: {
            ...deviceInitialState,
            selectedDevice: {
                ...defaultDevice,
                authenticityChecks: {
                    firmwareRevision: {
                        success: false,
                        error: 'revision-mismatch',
                    },
                    firmwareHash: { success: true },
                },
            },
        },
        result: 'TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT',
    },
];

describe(`${DeviceCompromised.name} component`, () => {
    deviceCompromisedFixtures.forEach(({ description, device, result }) => {
        it(description, () => {
            const store = initStore(getInitialState(device));
            const { getByText, unmount } = renderWithProviders(
                store,
                extraDependenciesMock.services,
                <DeviceCompromised />,
            );
            expect(getByText(result)).not.toBeNull();
            unmount();
        });
    });
});
