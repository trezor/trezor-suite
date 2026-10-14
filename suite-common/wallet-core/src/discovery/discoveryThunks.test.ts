import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { mockFetchAndSaveMetadata } from '@suite-common/metadata-types/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect, { type StaticSessionId, asDeviceUniquePath } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type RunDiscoveryThunkDeps,
    type RunDiscoveryThunkState,
    runDiscoveryThunk,
} from './discoveryThunks';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import { initialWalletSettingsState } from '../settings/walletSettingsReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            getDeviceState: jest.fn(),
            discoverAccounts: jest.fn(),
            cancel: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        },
    };
});

const mockGetDeviceState = jest.mocked(TrezorConnect.getDeviceState);
const mockDiscoverAccounts = jest.mocked(TrezorConnect.discoverAccounts);

const devicePath = asDeviceUniquePath('device-path');
const hiddenWalletSessionId: StaticSessionId = 'hidden-wallet@device-id:1';
const standardWalletSessionId: StaticSessionId = 'standard-wallet@device-id:1';

type CreateStateParams = {
    device: TrezorDevice;
};

const createState = ({ device }: CreateStateParams): RunDiscoveryThunkState => ({
    wallet: {
        accounts: [],
        blockchain: blockchainInitialState,
        discovery: {
            [devicePath]: { status: 'starting', isAddingHiddenWallet: true },
        },
        settings: { ...initialWalletSettingsState, enabledNetworks: [asNetworkSymbol('btc')] },
    },
    device: {
        devices: [device],
        selectedDevice: device,
    },
    persistentDeviceData: persistentDeviceDataInitialState,
    tokenDefinitions: tokenDefinitionsInitialState,
    networks: mockNetworksState([asNetworkSymbol('btc')]),
});

const createExtra = (): RunDiscoveryThunkDeps => ({
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
    },
    thunks: { fetchAndSaveMetadata: mockFetchAndSaveMetadata() },
});

// Adds a hidden wallet on a device which has no standard wallet in Suite yet. A device with the
// passphrase always entered on it can't be given the empty passphrase: asked for it, the device
// lets the user enter the passphrase again, the same one here.
const addHiddenWallet = async (isPassphraseAlwaysOnDevice: boolean) => {
    const device = mockSuiteDevice(
        { path: devicePath, connected: true, available: true },
        { passphrase_protection: true, passphrase_always_on_device: isPassphraseAlwaysOnDevice },
    );
    mockGetDeviceState.mockImplementation(params =>
        Promise.resolve({
            success: true,
            payload: {
                state: {
                    staticSessionId:
                        params?.device?.useEmptyPassphrase && !isPassphraseAlwaysOnDevice
                            ? standardWalletSessionId
                            : hiddenWalletSessionId,
                },
            },
        }),
    );
    const state = createState({ device });
    const { dispatch } = createMockDispatch({ getState: () => state, extra: createExtra() });

    await dispatch(runDiscoveryThunk({ device }));
};

const getUseEmptyPassphraseOfDeviceStateCalls = () =>
    mockGetDeviceState.mock.calls.map(([params]) => params?.device?.useEmptyPassphrase);

const expectHiddenWalletDiscovery = () =>
    expect(mockDiscoverAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
            device: expect.objectContaining({ useEmptyPassphrase: false }),
        }),
    );

describe(runDiscoveryThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Discovery itself is not the subject here, it just ends the thunk.
        mockDiscoverAccounts.mockResolvedValue({
            success: false,
            error: { message: 'discovery not tested', code: 'Backend_Error' },
        });
    });

    it('checks whether the passphrase of a new hidden wallet is in fact the empty one', async () => {
        await addHiddenWallet(false);

        expect(getUseEmptyPassphraseOfDeviceStateCalls()).toEqual([false, true]);
        expectHiddenWalletDiscovery();
    });

    it('does not ask again for the passphrase always entered on the device', async () => {
        await addHiddenWallet(true);

        expect(getUseEmptyPassphraseOfDeviceStateCalls()).toEqual([false]);
        expectHiddenWalletDiscovery();
    });
});
