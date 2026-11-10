import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect, {
    UI_EVENTS,
    UI_REQUEST,
    UI_REQUESTS,
    asDeviceUniquePath,
} from '@trezor/connect';
import { type UiRequestMessage, createUiRequestMessage } from '@trezor/connect-common';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { type RunDiscoveryThunkState } from './discoveryThunks';
import {
    type RunPassphraseWalletAddingDiscoveryThunkDeps,
    runPassphraseWalletAddingDiscoveryThunk,
} from './passphraseWalletThunks';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import { initialWalletSettingsState } from '../settings/walletSettingsReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, getDeviceState: jest.fn(), on: jest.fn(), off: jest.fn() },
    };
});

const devicePath = asDeviceUniquePath('device-path');
const standardWallet = mockSuiteDevice({
    path: devicePath,
    instance: 1,
    connected: true,
    state: { staticSessionId: 'standard@device-id:1' },
    useEmptyPassphrase: true,
});
const statelessDevice = mockSuiteDevice({ path: devicePath, instance: 2, connected: true });

const state: RunDiscoveryThunkState = {
    wallet: {
        accounts: [],
        blockchain: blockchainInitialState,
        discovery: {
            [devicePath]: {
                status: 'starting',
                isAddingHiddenWallet: true,
                useScopedCallIds: true,
            },
        },
        settings: initialWalletSettingsState,
    },
    device: {
        devices: [standardWallet, statelessDevice],
        selectedDevice: statelessDevice,
        buttonRequestsByPath: {},
    },
    persistentDeviceData: persistentDeviceDataInitialState,
    tokenDefinitions: tokenDefinitionsInitialState,
    networks: mockNetworksState([asNetworkSymbol('btc')]),
};

const extra: RunPassphraseWalletAddingDiscoveryThunkDeps = {
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
        reportSecurityCheck: jest.fn(),
        connectInitUIEventHooks: {},
    },
    thunks: { fetchAndSaveMetadata: jest.fn() },
};

const emitUiRequest = (message: UiRequestMessage) => {
    jest.mocked(TrezorConnect.on).mock.calls.forEach(([event, listener]) => {
        if (event === UI_REQUEST) listener(message);
    });
};

describe('runPassphraseWalletAddingDiscoveryThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('closes the PIN modal once a locked device asks for the passphrase', async () => {
        jest.mocked(TrezorConnect.getDeviceState).mockImplementation(({ callId }) => {
            emitUiRequest({
                ...createUiRequestMessage(
                    UI_REQUESTS.REQUEST_PIN,
                    { device: statelessDevice, type: 'PinMatrixRequestType_Current' },
                    { requestId: 'pin-request' },
                ),
                callId,
            });
            emitUiRequest({
                ...createUiRequestMessage(
                    UI_REQUESTS.REQUEST_PASSPHRASE,
                    { device: statelessDevice },
                    { requestId: 'passphrase-request' },
                ),
                callId,
            });

            // The device returns an already known wallet so the run ends right after the prompts.
            return Promise.resolve({
                success: true,
                payload: { state: { staticSessionId: 'standard@device-id:1' } },
            });
        });
        const { actions, dispatch } = createMockDispatch({ getState: () => state, extra });

        await dispatch(runPassphraseWalletAddingDiscoveryThunk({ device: statelessDevice }));

        const pinRequestIndex = actions.findIndex(
            action => (action as UiRequestMessage).type === UI_REQUESTS.REQUEST_PIN,
        );
        const closeWindowIndex = actions.findIndex(
            action => (action as { type: string }).type === UI_EVENTS.CLOSE_UI_WINDOW,
        );
        expect(pinRequestIndex).toBeGreaterThanOrEqual(0);
        expect(closeWindowIndex).toBeGreaterThan(pinRequestIndex);
        // The passphrase is entered in PassphraseModal, so the request must not open a global modal.
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: UI_REQUESTS.REQUEST_PASSPHRASE }),
        );
    });
});
