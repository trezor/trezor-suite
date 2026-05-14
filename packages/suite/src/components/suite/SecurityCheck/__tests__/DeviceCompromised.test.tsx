import '@suite-common/test-utils/src/globalOverrides';

import { type TranslationKey } from '@suite/intl';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import * as deviceUtils from '@suite-common/suite-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
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

const defaultDevice = mockSuiteDevice();
if (!deviceUtils.isDeviceAcquired(defaultDevice)) {
    throw 'mockSuiteDevice() must return an AcquiredDevice here.';
}
// derived from this device
const matchingDevicePersistentData = {
    ...defaultDevicePersistentData,
    device_id: defaultDevice.features.device_id,
    unit_color: defaultDevice.features.unit_color,
    internal_model: defaultDevice.features.internal_model,
};

const deviceCompromisedFixtures: Array<{
    description: string;
    device: DeviceReducerState;
    result: TranslationKey;
}> = [
    {
        description: 'Entropy check error',
        device: {
            ...deviceInitialState,
            persistentDeviceData: [
                {
                    ...matchingDevicePersistentData,
                    lastEntropyCheckResult: { success: false },
                },
            ],
            selectedDevice: mockSuiteDevice(),
        },
        result: 'TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT',
    },
    {
        description: 'Firmware hash check error',
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
        description: 'Firmware revision check error',
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
    {
        description: 'Device Id check error',
        device: { ...initialAppState.device, selectedDevice: { ...defaultDevice, id: null } },
        result: 'TR_DEVICE_COMPROMISED_INVALID_ID_TEXT',
    },
    {
        description: 'Device invariability check error',
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
        result: 'TR_DEVICE_COMPROMISED_INVARIABILITY_CHECK_FAILED_TEXT',
    },
];

describe(`${DeviceCompromised.name} component`, () => {
    deviceCompromisedFixtures.forEach(({ description, device, result }) => {
        it(description, () => {
            const store = initStore(getInitialState(device));
            const { getByText, unmount } = renderWithProviders(
                store,
                extraDependenciesDesktopMock.services,
                <DeviceCompromised />,
            );
            expect(getByText(result)).not.toBeNull();
            unmount();
        });
    });
});
