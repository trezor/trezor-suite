import { DeviceReducerState } from '@suite-common/wallet-core';
import { DeepPartial } from '@trezor/type-utils';

import { TranslationKey } from 'src/components/suite/Translation';
import { AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { DeviceCompromised } from '../DeviceCompromised';

jest.mock('@suite-common/tx-simulation', () => ({}));

// render only Translation.id in data-test attribute
jest.mock('src/components/suite/Translation', () => ({
    Translation: ({ id }: any) => <span data-testid={id}>{id}</span>,
}));

const mockStore = configureStore<AppState, any>();

const initStore = (state: AppState) => mockStore(state);

const getInitialState = (device: DeepPartial<DeviceReducerState>): AppState =>
    ({
        ...initialAppState,
        device,
    }) as AppState;

const deviceCompromisedFixtures: Array<{
    description: string;
    device: DeepPartial<DeviceReducerState>;
    result: TranslationKey;
}> = [
    {
        description: 'Failed entropy check',
        device: {
            devices: [{ id: 'deviceId' }],
            devicesWithFailedEntropyCheck: ['deviceId'],
            selectedDevice: 'deviceId',
        },
        result: 'TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT',
    },
    {
        description: 'Failed firmware hash check',
        device: {
            devices: [
                {
                    id: 'a',
                    path: 'a',
                    authenticityChecks: {
                        firmwareHash: {
                            error: 'hash-mismatch',
                        },
                    },
                    features: { device_id: 'a' },
                },
            ],
            selectedDevice: 'a',
        },
        result: 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
    },
    {
        description: 'Firmware hash check other-error (1st occurrence)',
        device: {
            selectedDevice: 'deviceId',
            devices: [
                {
                    id: 'deviceId',
                    connected: true,
                    authenticityChecks: {
                        firmwareHash: {
                            error: 'other-error',
                        },
                    },
                    features: {
                        device_id: 'deviceId',
                    },
                },
            ],
        },
        result: 'TR_FAILED_VERIFY_DEVICE_TEXT',
    },
    {
        description: 'Firmware hash check other-error (2nd occurrence)',
        device: {
            devices: [
                {
                    id: 'deviceId',
                    connected: true,
                    authenticityChecks: {
                        firmwareHash: {
                            error: 'other-error',
                        },
                    },
                    features: {
                        device_id: 'deviceId',
                    },
                },
            ],
            selectedDevice: 'deviceId',
            lastConnectedAuthenticityChecks: {
                firmwareHash: {
                    error: 'other-error',
                },
            },
        },
        result: 'TR_FAILED_VERIFY_DEVICE_AGAIN_TEXT',
    },
    {
        description: 'Failed firmware revision check',
        device: {
            devices: [
                {
                    id: 'deviceId',
                    connected: true,
                    authenticityChecks: {
                        firmwareRevision: {
                            error: 'revision-mismatch',
                        },
                    },
                    features: {
                        device_id: 'deviceId',
                    },
                },
            ],
            selectedDevice: 'deviceId',
        },
        result: 'TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT',
    },
];

describe(`${DeviceCompromised.name} component`, () => {
    deviceCompromisedFixtures.forEach(({ description, device, result }) => {
        it(description, () => {
            const store = initStore(getInitialState(device));
            const { getByText, unmount } = renderWithProviders(store, <DeviceCompromised />);
            expect(getByText(result)).not.toBeNull();
            unmount();
        });
    });
});
