import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type DeviceRootState, deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import TrezorConnect, { type StaticSessionId, asDeviceUniquePath } from '@trezor/connect';
import { createMockDispatch, mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { discoveryActions } from './discoveryActions';
import {
    type RunAdditionalDiscoveryThunkDeps,
    type RunAdditionalDiscoveryThunkState,
    type RunDiscoveryThunkDeps,
    type RunDiscoveryThunkState,
    applyDeviceStatesThunk,
    runAdditionalDiscoveryThunk,
    runDiscoveryThunk,
} from './discoveryThunks';
import { blockchainInitialState } from '../blockchain/blockchainReducer';
import {
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '../settings/walletSettingsReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            getDeviceState: jest.fn(),
            discoverAccounts: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        },
    };
});

type State = DeviceRootState & WalletSettingsRootState;

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});

const devicePath = asDeviceUniquePath('device-path');
const hiddenWallet = mockSuiteDevice({
    path: devicePath,
    instance: 1,
    connected: true,
    state: { staticSessionId: 'hidden-passphrase@device-id:1' },
    useEmptyPassphrase: false,
});
const statelessDevice = mockSuiteDevice({ path: devicePath, instance: 2, connected: true });

const initStore = (devices: TrezorDevice[], isAutoEjectEnabled = false) =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            device: deviceReducer,
            wallet: combineReducers({
                settings: (state = initialWalletSettingsState) => state,
            }),
        }),
        preloadedState: {
            device: {
                devices,
                buttonRequestsByPath: {},
            },
            wallet: {
                settings: { ...initialWalletSettingsState, isAutoEjectEnabled },
            },
        },
    }).services.store;

describe('applyDeviceStatesThunk', () => {
    it('authorizes the stateless device when an authorized wallet is listed first on the same path', async () => {
        const store = initStore([hiddenWallet, statelessDevice]);

        await store
            .dispatch(
                applyDeviceStatesThunk({
                    newDeviceState: { staticSessionId: 'standard@device-id:1' },
                    isAddingHiddenWallet: false,
                    devicePath,
                }),
            )
            .unwrap();

        const { devices } = store.getState().device;
        expect(devices.find(d => d.instance === 1)).toMatchObject({
            state: hiddenWallet.state,
            useEmptyPassphrase: false,
            remember: false,
        });
        expect(devices.find(d => d.instance === 2)).toMatchObject({
            state: { staticSessionId: 'standard@device-id:1' },
            useEmptyPassphrase: true,
            remember: true,
        });
    });

    // The wallet it is added next to starts with the opposite value to detect a mix-up.
    it.each([
        { isAutoEjectEnabled: false, siblingRemember: false, expectedRemember: true },
        { isAutoEjectEnabled: true, siblingRemember: true, expectedRemember: false },
    ])(
        'applies remember to the added wallet, not to the wallet it is added next to (auto eject: $isAutoEjectEnabled)',
        async ({ isAutoEjectEnabled, siblingRemember, expectedRemember }) => {
            const standardWallet = mockSuiteDevice({
                path: devicePath,
                instance: 1,
                connected: true,
                state: { staticSessionId: 'standard@device-id:1' },
                useEmptyPassphrase: true,
                remember: siblingRemember,
            });
            const store = initStore([standardWallet], isAutoEjectEnabled);

            await store
                .dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: { staticSessionId: 'hidden-passphrase@device-id:2' },
                        isAddingHiddenWallet: true,
                        devicePath,
                    }),
                )
                .unwrap();

            const { devices } = store.getState().device;
            expect(devices.find(d => d.instance === 1)).toMatchObject({
                remember: siblingRemember,
            });
            expect(devices.find(d => d.instance === 2)).toMatchObject({
                state: { staticSessionId: 'hidden-passphrase@device-id:2' },
                useEmptyPassphrase: false,
                remember: expectedRemember,
            });
        },
    );
});

describe('runDiscoveryThunk duplicates', () => {
    const existingWalletState: StaticSessionId = 'standard@device-id:1';
    const existingWallet = mockSuiteDevice({
        path: devicePath,
        instance: 1,
        connected: true,
        state: { staticSessionId: existingWalletState },
        useEmptyPassphrase: true,
    });

    const createState = (discovery: DiscoveryStatus): RunDiscoveryThunkState => ({
        wallet: {
            accounts: [],
            blockchain: blockchainInitialState,
            discovery: { [devicePath]: discovery },
            settings: initialWalletSettingsState,
        },
        device: {
            devices: [existingWallet, statelessDevice],
            selectedDevice: statelessDevice,
            buttonRequestsByPath: {},
        },
        persistentDeviceData: persistentDeviceDataInitialState,
        tokenDefinitions: tokenDefinitionsInitialState,
        networks: mockNetworksState([asNetworkSymbol('btc')]),
    });

    const createExtra = (): RunDiscoveryThunkDeps => ({
        services: {
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
            reportSecurityCheck: jest.fn(),
        },
        thunks: { fetchAndSaveMetadata: jest.fn() },
    });

    const runDiscovery = async (discovery: DiscoveryStatus) => {
        // The device returns the state of the wallet which is already in the list.
        jest.mocked(TrezorConnect.getDeviceState).mockResolvedValue({
            success: true,
            payload: { state: { staticSessionId: 'standard@device-id:0' } },
        });
        const state = createState(discovery);
        const { actions, dispatch } = createMockDispatch({
            getState: () => state,
            extra: createExtra(),
        });

        await dispatch(runDiscoveryThunk({ device: statelessDevice }));

        return actions;
    };

    it('selects the existing wallet when a standard wallet is added twice', async () => {
        const actions = await runDiscovery({ status: 'starting', isAddingHiddenWallet: false });

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery({ status: 'complete' }, devicePath),
        );
        expect(actions).toContainEqual(deviceActions.selectDevice(existingWallet));
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: deviceActions.addAuthorizedDevice.type }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: deviceActions.setDeviceState.type }),
        );
    });

    it('asks the user what to do when a passphrase wallet is a duplicate', async () => {
        const actions = await runDiscovery({ status: 'starting', isAddingHiddenWallet: true });

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery(
                {
                    status: 'passphrase-duplicate',
                    duplicateDeviceStaticSessionId: existingWalletState,
                },
                devicePath,
            ),
        );
        expect(actions).not.toContainEqual(deviceActions.selectDevice(existingWallet));
    });
});

describe('runAdditionalDiscoveryThunk', () => {
    const staticSessionId: StaticSessionId = 'standard@device-id:1';
    const standardWallet = mockSuiteDevice({
        path: devicePath,
        instance: 1,
        connected: true,
        state: { staticSessionId, sessionId: 'session-id' },
        useEmptyPassphrase: true,
        discovered: true,
    });

    const state: RunAdditionalDiscoveryThunkState = {
        wallet: {
            accounts: [],
            blockchain: blockchainInitialState,
            discovery: { [devicePath]: { status: 'starting', isAddingHiddenWallet: false } },
            settings: initialWalletSettingsState,
        },
        device: {
            devices: [standardWallet],
            selectedDevice: standardWallet,
            buttonRequestsByPath: {},
        },
        persistentDeviceData: persistentDeviceDataInitialState,
        tokenDefinitions: tokenDefinitionsInitialState,
        networks: mockNetworksState([asNetworkSymbol('btc')]),
    };

    const extra: RunAdditionalDiscoveryThunkDeps = {
        services: {
            analytics: mockAnalytics<AnalyticsSharedEvents>(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
            reportSecurityCheck: jest.fn(),
        },
    };

    const runAdditionalDiscovery = async (
        discoverAccountsResult: Awaited<ReturnType<typeof TrezorConnect.discoverAccounts>>,
    ) => {
        jest.mocked(TrezorConnect.discoverAccounts).mockResolvedValue(discoverAccountsResult);
        const { actions, dispatch } = createMockDispatch({ getState: () => state, extra });

        await dispatch(runAdditionalDiscoveryThunk(staticSessionId));

        return actions;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // The wallet balance report is debounced for minutes.
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('discovers the accounts of the authorized wallet without reading its device state first', async () => {
        const actions = await runAdditionalDiscovery({
            success: true,
            payload: { empty: 0, nonempty: 1, failed: 0 },
        });

        expect(TrezorConnect.getDeviceState).not.toHaveBeenCalled();
        expect(TrezorConnect.discoverAccounts).toHaveBeenCalledWith(
            expect.objectContaining({
                device: {
                    path: devicePath,
                    instance: 1,
                    state: { staticSessionId, sessionId: 'session-id' },
                    useEmptyPassphrase: true,
                },
            }),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: deviceActions.setDeviceState.type }),
        );
        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery({ status: 'complete' }, devicePath),
        );
        expect(actions).toContainEqual(deviceActions.setDiscovered(staticSessionId, true));
    });

    it('marks the discovery as failed when the device state is not valid', async () => {
        const actions = await runAdditionalDiscovery({
            success: false,
            error: { message: 'Passphrase is incorrect', code: 'Device_InvalidState' },
        });

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery(
                {
                    status: 'failed',
                    error: 'Passphrase is incorrect',
                    errorCode: 'Device_InvalidState',
                },
                devicePath,
            ),
        );
        expect(actions).toContainEqual(deviceActions.setDiscovered(staticSessionId, false));
    });

    it('keeps the discovery cancelled when it was cancelled by the user', async () => {
        const actions = await runAdditionalDiscovery({
            success: false,
            error: { message: 'USER_UI_CANCEL', code: 'Method_Cancel' },
        });

        expect(actions).not.toContainEqual(
            discoveryActions.updateDiscovery(
                { status: 'failed', error: 'USER_UI_CANCEL', errorCode: 'Method_Cancel' },
                devicePath,
            ),
        );
    });

    it('marks the discovery as cancelled when it was cancelled on the device', async () => {
        const actions = await runAdditionalDiscovery({
            success: false,
            error: { message: 'Action cancelled by user', code: 'Failure_ActionCancelled' },
        });

        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery({ status: 'cancelled' }, devicePath),
        );
        expect(actions).not.toContainEqual(
            expect.objectContaining({
                type: discoveryActions.updateDiscovery.type,
                payload: expect.objectContaining({
                    status: expect.objectContaining({ status: 'failed' }),
                }),
            }),
        );
    });
});
